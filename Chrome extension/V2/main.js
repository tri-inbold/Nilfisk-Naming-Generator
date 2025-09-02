// --- CONSTANTS & STATE ---
const assetTypeSizeMapping = { 'Brochure': 'A4', 'Carousel Ads': '1200x1200px', 'Rollup': '85x200cm', 'Fact sheet': 'A4', 'Online banners': '300x300px, 250x250px, 300x600px, 728x90px, 300x250px, 160x600px', 'Powerpoint': '16:9', 'SoMe': '1200x1200px', 'Desktop background': '1920x1080px', 'Teams background': '1920x1080px', 'Emails': '600x600px', 'Sales demo video': '4k', 'QSG video': '1080p', 'Email signature': '600x278px', 'Landing page': '1920x1080px', 'Frontpage tile': '728x600px', 'Service poster': 'A4', 'FAQ': 'A4', 'One pager': 'A4', 'Articles': 'A4', 'Shelf wobler': '10x10cm', 'Ebook': 'A4', 'Case Study': 'A4', 'Policy': 'A4', 'Business Cards': '9x5cm', 'Employee IDs': '8.6x5.4cm', 'Certificate': 'A4', 'Name tags': '7.5cmx4cm', 'Advertisements': 'A4', 'Sticker': '5x5cm' };
const languageData = [ { code: 'EN-MASTER', language: 'English US', country: 'Global' }, { code: 'ES-AR', language: 'Spanish', country: 'Argentina' }, { code: 'EN-AU', language: 'English', country: 'Australia' }, { code: 'DE-AT', language: 'German', country: 'Austria' }, { code: 'NL-BE', language: 'Dutch', country: 'Belgium' }, { code: 'FR-BE', language: 'French', country: 'Belgium' }, { code: 'EN-CA', language: 'English', country: 'Canada' }, { code: 'FR-CA', language: 'French', country: 'Canada' }, { code: 'ES-CL', language: 'Spanish', country: 'Chile' }, { code: 'ZH-CN', language: 'Chinese', country: 'China' }, { code: 'CS-CZ', language: 'Czech', country: 'Czech Republic' }, { code: 'DA-DK', language: 'Danish', country: 'Denmark' }, { code: 'FI-FI', language: 'Finnish', country: 'Finland' }, { code: 'FR-FR', language: 'French', country: 'France' }, { code: 'DE-DE', language: 'German', country: 'Germany' }, { code: 'HU-HU', language: 'Hungarian', country: 'Hungary' }, { code: 'EN-IN', language: 'English', country: 'India' }, { code: 'IT-IT', language: 'Italian', country: 'Italy' }, { code: 'JA-JP', language: 'Japanese', country: 'Japan' }, { code: 'KO-KR', language: 'Korean', country: 'Korea' }, { code: 'ES-MX', language: 'Spanish', country: 'Mexico' }, { code: 'NL-NL', language: 'Dutch', country: 'Netherlands' }, { code: 'NB-NO', language: 'Norwegian', country: 'Norway' }, { code: 'PL-PL', language: 'Polish', country: 'Poland' }, { code: 'PT-PT', language: 'Portuguese', country: 'Portugal' }, { code: 'RO-RO', language: 'Romanian', country: 'Romania' }, { code: 'RU-RU', language: 'Russian', country: 'Russia' }, { code: 'EN-SG', language: 'English', country: 'Singapore' }, { code: 'ES-ES', language: 'Spanish', country: 'Spain' }, { code: 'SV-SE', language: 'Swedish', country: 'Sweden' }, { code: 'DE-CH', language: 'German', country: 'Switzerland' }, { code: 'FR-CH', language: 'French', country: 'Switzerland' }, { code: 'TR-TR', language: 'Turkish', country: 'Turkey' }, { code: 'EN-GB', language: 'English', country: 'UK' }, { code: 'EN-US', language: 'English', country: 'USA' } ];
const FORM_FIELDS = ['msNumber', 'campaign', 'productName', 'fy', 'assetType', 'sizeFormat', 'specs', 'variation', 'languageCountry'];

let displayedLanguageData = [...languageData];
let currentSort = { column: 'code', direction: 'asc' };

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Luôn chạy các hàm thiết lập chung
    document.getElementById('fy').value = new Date().getFullYear().toString();
    populateAssetTypeDatalist();
    setupCommonListeners();

    // Chạy các hàm thiết lập theo ngữ cảnh (popup hoặc sidebar)
    if (document.body.classList.contains('popup-mode')) {
        setupPopupListeners();
        loadFormData();
    } else if (document.querySelector('.sidebar-container')) {
        setupSidebarListeners();
        loadAndDisplayNames();
        initializeLanguageTable();
    }
});

// --- EVENT LISTENERS & SETUP ---

// Listener chung cho cả popup và sidebar
function setupCommonListeners() {
    document.getElementById('assetType').addEventListener('input', handleAssetTypeChange);
    ['msNumber', 'variation', 'languageCountry'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => e.target.value = e.target.value.toUpperCase());
    });
    document.addEventListener('keydown', handleGlobalKeydown);
}

// Listener chỉ dành cho popup
function setupPopupListeners() {
    FORM_FIELDS.forEach(id => {
        document.getElementById(id).addEventListener('input', saveFormData);
    });
}

// Listener chỉ dành cho sidebar
function setupSidebarListeners() {
    document.getElementById('clearListButton')?.addEventListener('click', handleClearList);
    chrome.storage.onChanged.addListener(handleStorageChange);
    document.getElementById('languageCountry').addEventListener('input', updateTableSelection);
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.getAttribute('data-tab')));
    });
    document.getElementById('languageSearch')?.addEventListener('input', handleLanguageSearch);
    document.querySelectorAll('.language-table th[data-column]').forEach(header => {
        header.addEventListener('click', () => handleSortClick(header.getAttribute('data-column')));
    });
}

// --- EVENT HANDLERS ---

function handleAssetTypeChange(event) {
    if (assetTypeSizeMapping[event.target.value]) {
        document.getElementById('sizeFormat').value = assetTypeSizeMapping[event.target.value];
    }
}

function handleGlobalKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        generateAndStoreNames();
    }
    if (event.ctrlKey && event.key === 'Backspace') {
        event.preventDefault();
        clearAllFields();
    }
}

function handleClearList() {
    chrome.storage.local.set({ generatedNames: [] }, () => showToast('List cleared!'));
}

function handleStorageChange(changes, namespace) {
    if (namespace === 'local' && changes.generatedNames) {
        updateNamesList(changes.generatedNames.newValue || []);
    }
}

function handleLanguageSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    displayedLanguageData = languageData.filter(lang =>
        Object.values(lang).some(val => String(val).toLowerCase().includes(searchTerm))
    );
    sortTable(currentSort.column, true); // Sắp xếp lại kết quả tìm kiếm
}

function handleSortClick(column) {
    sortTable(column);
}

// --- CORE LOGIC (POPUP & NAME GENERATION) ---

function saveFormData() {
    const data = {};
    FORM_FIELDS.forEach(id => data[id] = document.getElementById(id).value);
    chrome.storage.local.set({ savedFormData: data });
}

function loadFormData() {
    chrome.storage.local.get('savedFormData', result => {
        if (result.savedFormData) {
            FORM_FIELDS.forEach(id => {
                const element = document.getElementById(id);
                if (element && result.savedFormData[id] !== undefined) {
                    element.value = result.savedFormData[id];
                }
            });
        }
    });
}

function clearAllFields() {
    FORM_FIELDS.forEach(id => {
        if (id !== 'fy') document.getElementById(id).value = '';
    });
    document.getElementById('fy').value = new Date().getFullYear().toString();
    document.getElementById('msNumber').focus();
    if (document.body.classList.contains('popup-mode')) {
        chrome.storage.local.remove('savedFormData');
    }
}

function generateAndStoreNames() {
    const fields = FORM_FIELDS.map(id => document.getElementById(id).value.trim());
    const processedFields = fields.filter(field => field).map(field => field.split(',').map(part => part.trim().replace(/\s+/g, '-')).filter(part => part));
    if (processedFields.every(arr => arr.length === 0)) return;
    const newNames = generateCombinations(processedFields).map(combo => combo.join('_'));
    if (newNames.length > 0) {
        chrome.storage.local.get({ generatedNames: [] }, data => {
            const updatedNames = [...newNames.reverse(), ...data.generatedNames];
            chrome.storage.local.set({ generatedNames: updatedNames });
        });
        copyToClipboard(newNames.join('\n'), `Copied ${newNames.length} name(s)!`);
    }
}

function generateCombinations(arrays) {
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

// --- SIDEBAR: TABS & LANGUAGE TABLE ---

function loadAndDisplayNames() {
    chrome.storage.local.get({ generatedNames: [] }, data => {
        updateNamesList(data.generatedNames || []);
    });
}

function updateNamesList(names) {
    const container = document.getElementById('namesList');
    if (!container) return;
    container.innerHTML = '';
    names.forEach(name => {
        const item = document.createElement('div');
        item.className = 'name-item';
        item.textContent = name;
        item.onclick = () => copyToClipboard(name, 'Copied single name!');
        container.appendChild(item);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function initializeLanguageTable() {
    sortTable(currentSort.column, true); // Render lần đầu
}

function selectLanguage(code) {
    const input = document.getElementById('languageCountry');
    if (!input) return;
    const currentValues = input.value ? input.value.split(',').map(c => c.trim()).filter(Boolean) : [];
    const codeIndex = currentValues.indexOf(code);
    if (codeIndex > -1) {
        currentValues.splice(codeIndex, 1);
    } else {
        currentValues.push(code);
    }
    input.value = currentValues.join(', ');
    input.dispatchEvent(new Event('input', { bubbles: true })); // Kích hoạt listener để cập nhật UI
}

function sortTable(column, keepDirection = false) {
    if (!keepDirection) {
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
    }
    displayedLanguageData.sort((a, b) => {
        const valA = a[currentSort.column]?.toLowerCase() || '';
        const valB = b[currentSort.column]?.toLowerCase() || '';
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    renderLanguageTable();
}

function renderLanguageTable() {
    const tableBody = document.getElementById('languageTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    displayedLanguageData.forEach(lang => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${lang.code}</td><td>${lang.language}</td><td>${lang.country}</td>`;
        row.addEventListener('click', () => selectLanguage(lang.code));
        tableBody.appendChild(row);
    });
    updateTableSelection();
    updateSortIndicators();
}

function updateTableSelection() {
    const input = document.getElementById('languageCountry');
    if (!input) return;
    const selectedCodes = new Set(input.value.split(',').map(c => c.trim()));
    document.querySelectorAll('#languageTableBody tr').forEach(row => {
        const code = row.cells[0].textContent;
        row.classList.toggle('selected', selectedCodes.has(code));
    });
}

function updateSortIndicators() {
    document.querySelectorAll('.language-table th[data-column]').forEach(th => {
        const columnKey = th.getAttribute('data-column');
        const arrow = th.querySelector('.sort-arrow');
        th.classList.remove('sorted');
        arrow.textContent = '';
        if (columnKey === currentSort.column) {
            th.classList.add('sorted');
            arrow.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
        }
    });
}

// --- UTILITY FUNCTIONS ---

function populateAssetTypeDatalist() {
    const datalist = document.getElementById('assetTypeOptions');
    if (!datalist) return;
    datalist.innerHTML = '';
    Object.keys(assetTypeSizeMapping).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        datalist.appendChild(option);
    });
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => showToast(message));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}