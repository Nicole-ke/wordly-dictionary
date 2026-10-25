

/* Find the HTML elements we need to use */
const searchForm = document.getElementById("search-form");
const wordInput = document.getElementById("word-input");
const results = document.getElementById("results");
const message = document.getElementById("message");
const favoritesList = document.getElementById("favorites-list");
const themeButton = document.getElementById("theme-button");

/* Get saved favorite words from the browser */
let favorites = [];

try {
    favorites = JSON.parse(
        localStorage.getItem("wordlyFavorites")
    ) || [];

    if (!Array.isArray(favorites)) {
        favorites = [];
    }
} catch (error) {
    favorites = [];
}

/* Search for a word using the dictionary API */
function searchWord(word) {
    word = word.trim();

    if (word === "") {
        message.textContent = "Please enter a word first.";
        results.textContent = "";
        return;
    }

    message.textContent = "Looking up your word...";
    results.textContent = "";

    const apiURL =
        "https://api.dictionaryapi.dev/api/v2/entries/en/" +
        encodeURIComponent(word);

    fetch(apiURL)
        .then(function(response) {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("WORD_NOT_FOUND");
                }

                throw new Error("API_UNAVAILABLE");
            }

            return response.json();
        })
        .then(function(data) {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("WORD_NOT_FOUND");
            }

            displayWord(data[0]);
            message.textContent = "";
        })
        .catch(function(error) {
            console.log("Dictionary request failed:", error);

            if (error.message === "WORD_NOT_FOUND") {
                message.textContent = "Word not found. Try another word.";
                results.textContent =
                    "Check the spelling or search for a different word.";
            } else {
                message.textContent =
                    "We could not connect to the dictionary.";
                results.textContent =
                    "Please check your internet connection and try again. " +
                    "The dictionary service may also be temporarily unavailable.";
            }
        });
}

/* Display the dictionary information */
function displayWord(wordData) {
    results.textContent = "";

    const wordHeading = document.createElement("h2");
    wordHeading.textContent = wordData.word;
    results.appendChild(wordHeading);

    let pronunciation = "";
    let audioURL = "";

    if (wordData.phonetics) {
        for (let i = 0; i < wordData.phonetics.length; i++) {
            if (wordData.phonetics[i].text && pronunciation === "") {
                pronunciation = wordData.phonetics[i].text;
            }

            if (wordData.phonetics[i].audio && audioURL === "") {
                audioURL = wordData.phonetics[i].audio;
            }
        }
    }

    const pronunciationText = document.createElement("p");
    pronunciationText.className = "pronunciation";
    pronunciationText.textContent =
        pronunciation || "Pronunciation not available.";

    results.appendChild(pronunciationText);

    if (audioURL !== "") {
        const audioButton = document.createElement("button");
        audioButton.textContent = "Play Pronunciation";
        audioButton.type = "button";

        const audioPlayer = new Audio(audioURL);

        audioButton.addEventListener("click", function() {
            audioPlayer.play().catch(function() {
                message.textContent = "Audio could not be played.";
            });
        });

        results.appendChild(audioButton);
    } else {
        const audioMessage = document.createElement("p");
        audioMessage.textContent = "No audio recording available.";
        results.appendChild(audioMessage);
    }

    if (wordData.meanings) {
        for (let i = 0; i < wordData.meanings.length; i++) {
            const meaning = wordData.meanings[i];

            const partOfSpeech = document.createElement("h3");
            partOfSpeech.textContent =
                "Part of speech: " + meaning.partOfSpeech;

            results.appendChild(partOfSpeech);

            for (let j = 0; j < meaning.definitions.length; j++) {
                const definition = meaning.definitions[j];

                const definitionBox = document.createElement("div");
                definitionBox.className = "definition";

                const definitionText = document.createElement("p");
                definitionText.textContent =
                    (j + 1) + ". " + definition.definition;

                definitionBox.appendChild(definitionText);

                if (definition.example) {
                    const example = document.createElement("p");
                    example.textContent = "Example: " + definition.example;
                    definitionBox.appendChild(example);
                }

                if (definition.synonyms && definition.synonyms.length > 0) {
                    const synonymText = document.createElement("p");
                    synonymText.textContent =
                        "Synonyms: " + definition.synonyms.join(", ");

                    definitionBox.appendChild(synonymText);
                }

                results.appendChild(definitionBox);
            }

            if (meaning.synonyms && meaning.synonyms.length > 0) {
                const synonyms = document.createElement("p");
                synonyms.textContent =
                    "More synonyms: " + meaning.synonyms.join(", ");

                results.appendChild(synonyms);
            }
        }
    }

    if (wordData.sourceUrls && wordData.sourceUrls.length > 0) {
        const source = document.createElement("p");
        source.textContent = "Source: " + wordData.sourceUrls[0];
        results.appendChild(source);
    }

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";

    const savedWord = wordData.word.toLowerCase();

    function updateFavoriteButton() {
        favoriteButton.textContent = favorites.includes(savedWord)
            ? "Saved to Favorites"
            : "Save to Favorites";
    }

    updateFavoriteButton();

    favoriteButton.addEventListener("click", function() {
        if (!favorites.includes(savedWord)) {
            favorites.push(savedWord);
            saveFavorites();
            displayFavorites();
            updateFavoriteButton();
            message.textContent = "Word saved to your favorites!";
        } else {
            message.textContent = "This word is already in your favorites.";
        }
    });

    results.appendChild(favoriteButton);
}

/* Save favorite words in the browser */
function saveFavorites() {
    try {
        localStorage.setItem(
            "wordlyFavorites",
            JSON.stringify(favorites)
        );
    } catch (error) {
        message.textContent =
            "Your favorites could not be saved in this browser.";
    }
}

/* Display all saved favorite words */
function displayFavorites() {
    favoritesList.textContent = "";

    if (favorites.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "You have not saved any words yet.";
        favoritesList.appendChild(emptyMessage);
        return;
    }

    for (let i = 0; i < favorites.length; i++) {
        const savedWord = favorites[i];
        const listItem = document.createElement("li");

        listItem.appendChild(document.createTextNode(savedWord + " "));

        const viewButton = document.createElement("button");
        viewButton.textContent = "View Word";
        viewButton.type = "button";

        viewButton.addEventListener("click", function() {
            wordInput.value = savedWord;
            searchWord(savedWord);
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.type = "button";

        removeButton.addEventListener("click", function() {
            favorites = favorites.filter(function(word) {
                return word !== savedWord;
            });

            saveFavorites();
            displayFavorites();
            message.textContent = "Favorite removed.";
        });

        listItem.appendChild(viewButton);
        listItem.appendChild(removeButton);
        favoritesList.appendChild(listItem);
    }
}

/* Handle the search form */
searchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    searchWord(wordInput.value);
});

/* Switch between light and dark themes */
themeButton.addEventListener("click", function() {
    document.body.classList.toggle("dark-theme");
});

/* Show saved words when the page opens */
displayFavorites();
