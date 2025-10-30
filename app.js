function testConnection() {
    if (!config.sheetId || !config.apiKey) {
        showAlert('setupStatus', 'Please save your configuration first', 'error');
        return;
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?key=${config.apiKey}`;
    
    showAlert('setupStatus', 'Testing connection...', 'info');
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error?.message || 'Connection failed');
                });
            }
            return response.json();
        })
        .then(data => {
            config.connected = true;
            saveConfigToStorage();
            showAlert('setupStatus', '✅ Connection successful! Your app is ready to use.', 'success');
            updateSetupStatus();
        })
        .catch(error => {
            config.connected = false;
            saveConfigToStorage();
            let errorMsg = '❌ Connection failed. ';
            if (error.message.includes('API key not valid')) {
                errorMsg += 'API Key is invalid. Please check your API key from Google Cloud Console.';
            } else if (error.message.includes('not found')) {
                errorMsg += 'Sheet not found. Please check your Sheet ID is correct.';
            } else if (error.message.includes('permission')) {
                errorMsg += 'Permission denied. Make sure your sheet is shared publicly (Anyone with link can view).';
            } else {
                errorMsg += 'Please check: 1) Sheet ID is correct, 2) API Key is valid, 3) Sheet is shared publicly (Anyone with link can view)';
            }
            showAlert('setupStatus', errorMsg, 'error');
            updateSetupStatus();
        });
}
