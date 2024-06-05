function searchCard() {
    var searchTerm = document.getElementById('searchTerm').value.trim();

    if (searchTerm === '') {
        alert('Por favor, insira um termo de busca.');
        return;
    }

    fetch('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(searchTerm))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na requisição.');
            }
            return response.json();
        })
        .then(data => {
            displayCards(data.data);
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

function displayCards(cards) {
    var cardResults = document.getElementById('cardResults');
    cardResults.innerHTML = '';

    cards.forEach(cardData => {
        var cardContainer = document.createElement('div');
        cardContainer.classList.add('card');

        var cardImage = document.createElement('img');
        cardImage.src = cardData.image_uris.normal;
        cardImage.alt = cardData.name;
        cardImage.addEventListener('click', function() {
            showModal(cardData);
        });
        cardContainer.appendChild(cardImage);

        cardResults.appendChild(cardContainer);
    });
}

async function showModal(cardData) {
    var modal = document.getElementById('modal');
    var modalCardDetails = document.getElementById('modalCardDetails');
    var modalCardImage = document.getElementById('modalCardImage');

    // Substitui os símbolos de mana no custo de mana pelas imagens correspondentes
    try {
        cardData.mana_cost = await replaceManaSymbolsWithImages(cardData.mana_cost);
    } catch (error) {
        console.error('Erro ao substituir símbolos de mana por imagens:', error);
    }

    modalCardDetails.innerHTML = `
        <h2>${cardData.name}</h2>
        <p><strong>Type:</strong> ${cardData.type_line}</p>
        <p><strong>Oracle Text:</strong> ${cardData.oracle_text}</p>
        <p><strong>Mana Cost:</strong> ${cardData.mana_cost}</p>
        <p><strong>Rarity:</strong> ${cardData.rarity}</p>
        <p><strong>Set:</strong> ${cardData.set_name}</p>
        <p><strong>Artist:</strong> ${cardData.artist}</p>
    `;

    // Verifica se a propriedade 'languages' está definida
    if (cardData.languages) {
        modalCardDetails.innerHTML += `
            <label for="language">Language:</label>
            <select id="language">
                ${cardData.languages.map(language => `<option value="${language}">${language}</option>`).join('')}
            </select>`;
    }

    // Verifica se a propriedade 'all_parts' está definida
    if (cardData.all_parts) {
        modalCardDetails.innerHTML += `
            <label for="edition">Edition:</label>
            <select id="edition">
                ${cardData.all_parts.map(part => `<option value="${part.id}">${part.set_name}</option>`).join('')}
            </select>`;
    }

    modalCardImage.src = cardData.image_uris.normal;

    modal.style.display = 'block';
}


async function replaceManaSymbolsWithImages(manaCost) {
    if (!manaCost) return '';

    // Obtém a lista de símbolos de mana
    const manaSymbols = manaCost.match(/{[^}]+}/g);

    if (!manaSymbols) return manaCost;

    const fetchSymbolPromises = manaSymbols.map(async symbol => {
        const symbolKey = symbol.substring(1, symbol.length - 1); // Remove os colchetes
        const symbolData = findSymbolDataByKey(symbolKey);
        if (!symbolData) return symbol; // Retorna o símbolo original se não houver dados correspondentes

        try {
            const response = await fetch(symbolData.svg_uri);
            if (!response.ok) {
                throw new Error(`Erro ao obter a imagem do símbolo de mana ${symbolKey}`);
            }
            const svgData = await response.text(); // Obtém o SVG como texto
            return svgData; // Retorna o SVG como texto
        } catch (error) {
            console.error(`Erro ao buscar a imagem do símbolo de mana ${symbolKey}:`, error);
            return symbol; // Retorna o símbolo original em caso de erro
        }
    });

    try {
        const fetchedSymbolImages = await Promise.all(fetchSymbolPromises);
        for (let i = 0; i < manaSymbols.length; i++) {
            manaCost = manaCost.replace(manaSymbols[i], fetchedSymbolImages[i]);
        }
        return manaCost;
    } catch (error) {
        console.error('Erro ao buscar imagens de símbolos de mana:', error);
        return manaCost; // Retorna o custo de mana original em caso de erro
    }
}


// Função auxiliar para encontrar dados do símbolo pelo nome da chave
function findSymbolDataByKey(key) {
    if (!symbolData || !symbolData.data) return null; // Retorna null se os dados do símbolo não estiverem disponíveis

    return symbolData.data.find(symbol => symbol.symbol === key);
}






function closeModal() {
    var modal = document.getElementById('modal');
    modal.style.display = 'none';
}


let symbolData;

async function fetchSymbolData() {
    try {
        const response = await fetch('https://api.scryfall.com/symbology');
        if (!response.ok) {
            throw new Error('Erro ao obter dados de simbologia.');
        }
        symbolData = await response.json();
    } catch (error) {
        console.error('Erro:', error);
    }
}



