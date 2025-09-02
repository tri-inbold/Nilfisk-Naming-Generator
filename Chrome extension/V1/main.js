// Data for auto-filling size based on asset type
const assetTypeSizeMapping = {
    'Brochure': 'A4', 'Carousel Ads': '1200x1200px', 'Rollup': '85x200cm',
    'Fact sheet': 'A4', 'Online banners': '300x300px, 250x250px, 300x600px, 728x90px, 300x250px, 160x600px',
    'Powerpoint': '16:9', 'SoMe': '1200x1200px', 'Desktop background': '1920x1080px',
    'Teams background': '1920x1080px', 'Emails': '600x600px', 'Sales demo video': '4k',
    'QSG video': '1080p', 'Email signature': '600x278px', 'Landing page': '1920x1080px',
    'Frontpage tile': '728x600px', 'Service poster': 'A4', 'FAQ': 'A4', 'One pager': 'A4',
    'Articles': 'A4', 'Shelf wobler': '10x10cm', 'Ebook': 'A4', 'Case Study': 'A4',
    'Policy': 'A4', 'Business Cards': '9x5cm', 'Employee IDs': '8.6x5.4cm',
    'Certificate': 'A4', 'Name tags': '7.5cmx4cm', 'Advertisements': 'A4', 'Sticker': '5x5cm'
};

// Function to populate the Asset Type datalist
function populateAssetTypeDatalist() {
    // Datalist might only exist in popup.html, so we check for its existence
    const datalist = document.getElementById('assetTypeOptions');
    if (!datalist) return;

    datalist.innerHTML = ''; // Clear old options

    // Loop through the data and create <option> elements for the datalist
    for (const type in assetTypeSizeMapping) {
        const option = document.createElement('option');
        option.value = type;
        datalist.appendChild(option);
    }
}

// Main function to run when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fy').value = new Date().getFullYear().toString();
    
    // Populate the datalist with options
    populateAssetTypeDatalist();

    setupInputListeners();
    setupKeydownListeners();

    // --- Sidebar-specific logic ---
    const namesListContainer = document.getElementById('namesList');
    if (namesListContainer) {
        loadAndDisplayNames();
        const clearButton = document.getElementById('clearListButton');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                chrome.storage.local.set({ generatedNames: [] }, () => {
                    showToast('List cleared!');
                });
            });
        }
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.generatedNames) {
                updateNamesList(changes.generatedNames.newValue || []);
            }
        });
    }
});

// Setup listeners for form inputs
function setupInputListeners() {
    // Use the 'input' event to update size as soon as a user types or selects from the list
    document.getElementById('assetType').addEventListener('input', function() {
        if (assetTypeSizeMapping[this.value]) {
            document.getElementById('sizeFormat').value = assetTypeSizeMapping[this.value];
        }
    });

    document.getElementById('msNumber').addEventListener('input', (e) => e.target.value = e.target.value.toUpperCase());
    document.getElementById('variation').addEventListener('input', (e) => e.target.value = e.target.value.toUpperCase());
    document.getElementById('languageCountry').addEventListener('input', (e) => e.target.value = e.target.value.toUpperCase());
}

// Setup listeners for keyboard shortcuts
function setupKeydownListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            generateAndStoreNames();
        }
        if (e.ctrlKey && e.key === 'Backspace') {
            e.preventDefault();
            clearAllFields();
        }
    });
}

// Clear all input fields
function clearAllFields() {
    const inputs = ['msNumber', 'campaign', 'productName', 'assetType', 'sizeFormat', 'specs', 'variation', 'languageCountry'];
    inputs.forEach(id => document.getElementById(id).value = '');
    document.getElementById('fy').value = new Date().getFullYear().toString();
    document.getElementById('msNumber').focus();
}

// Generate names from inputs and save them
function generateAndStoreNames() {
    const fields = [
        'msNumber', 'campaign', 'productName', 'fy', 'assetType',
        'sizeFormat', 'specs', 'variation', 'languageCountry'
    ].map(id => document.getElementById(id).value.trim());

    const processedFields = fields
        .filter(field => field)
        .map(field => field.split(',').map(part => part.trim().replace(/\s+/g, '-')).filter(part => part));
    
    if (processedFields.every(arr => arr.length === 0)) return;

    const newNames = generateCombinations(processedFields).map(combo => combo.join('_'));

    if (newNames.length > 0) {
        chrome.storage.local.get({ generatedNames: [] }, (data) => {
            const updatedNames = [...newNames.reverse(), ...data.generatedNames];
            chrome.storage.local.set({ generatedNames: updatedNames });
        });
        copyToClipboard(newNames.join('\n'), `Copied ${newNames.length} name(s)!`);
    }
}

// Helper function to generate combinations
function generateCombinations(arrays) {
    if (!arrays || arrays.length === 0) return [];
    const result = [];
    function backtrack(index, currentCombination) {
        if (index === arrays.length) {
            result.push([...currentCombination]);
            return;
        }
        for (const item of arrays[index]) {
            currentCombination.push(item);
            backtrack(index + 1, currentCombination);
            currentCombination.pop();
        }
    }
    backtrack(0, []);
    return result;
}

// --- Sidebar Display Functions ---
function loadAndDisplayNames() {
    chrome.storage.local.get({ generatedNames: [] }, (data) => {
        updateNamesList(data.generatedNames);
    });
}

function updateNamesList(names) {
    const namesListContainer = document.getElementById('namesList');
    if (!namesListContainer) return;
    namesListContainer.innerHTML = '';
    (names || []).forEach(name => {
        const nameItem = document.createElement('div');
        nameItem.className = 'name-item';
        nameItem.textContent = name;
        nameItem.onclick = () => copyToClipboard(name, 'Copied single name!');
        namesListContainer.appendChild(nameItem);
    });
}

// --- Utility Functions ---
function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => showToast(message));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}