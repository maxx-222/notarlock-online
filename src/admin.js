// src/admin.js (versiune finală cu listare și ștergere)

const cryptoUtils = {
    // ... (conținutul cryptoUtils rămâne la fel ca înainte) ...
    iterations: 100000, saltLength: 16, ivLength: 12,
    async generateKey(password, salt) { const enc = new TextEncoder(); const keyMaterial = await window.crypto.subtle.importKey( "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]); return window.crypto.subtle.deriveKey( { name: "PBKDF2", salt: salt, iterations: this.iterations, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]); },
    async encrypt(data, password) { const salt = window.crypto.getRandomValues(new Uint8Array(this.saltLength)); const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); const key = await this.generateKey(password, salt); const encryptedContent = await window.crypto.subtle.encrypt( { name: "AES-GCM", iv: iv }, key, data ); return { salt: this.arrayBufferToBase64(salt), iv: this.arrayBufferToBase64(iv), data: this.arrayBufferToBase64(encryptedContent) }; },
    arrayBufferToBase64(buffer) { let binary = ''; const bytes = new Uint8Array(buffer); for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); } return window.btoa(binary); }
};

const adminApp = {
    filesToProcess: [],

    init() {
        document.getElementById('fileInput').addEventListener('change', this.handleFileSelect.bind(this));
        document.getElementById('generateButton').addEventListener('click', this.processAndUpload.bind(this));
        document.getElementById('refreshButton').addEventListener('click', this.loadLinks.bind(this));
        
        // La încărcarea paginii, populăm tabelul
        this.loadLinks();
    },

    handleFileSelect(event) {
        // ... (funcția handleFileSelect rămâne la fel ca înainte) ...
        this.filesToProcess = Array.from(event.target.files);
        const fileList = document.getElementById('fileList');
        const passwordSection = document.getElementById('passwordSection');
        fileList.innerHTML = '';
        if (this.filesToProcess.length > 0) {
            this.filesToProcess.forEach(file => { const listItem = document.createElement('li'); listItem.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`; fileList.appendChild(listItem); });
            passwordSection.classList.remove('hidden');
        } else { passwordSection.classList.add('hidden'); }
    },

    async processAndUpload() {
        // ... (funcția processAndUpload rămâne la fel, dar DECOMENTĂM o linie) ...
        const passwordInput = document.getElementById('password'); const passwordConfirmInput = document.getElementById('passwordConfirm'); const statusDiv = document.getElementById('status');
        const password = passwordInput.value; const passwordConfirm = passwordConfirmInput.value; const clientName = document.getElementById('clientName').value || 'Nespecificat';
        if (!password || password.length < 6) { statusDiv.textContent = 'Parola trebuie să aibă minim 6 caractere.'; statusDiv.style.color = 'red'; return; }
        if (password !== passwordConfirm) { statusDiv.textContent = 'Parolele nu corespund.'; statusDiv.style.color = 'red'; return; }
        if (this.filesToProcess.length === 0) { statusDiv.textContent = 'Te rog selectează cel puțin un fișier.'; statusDiv.style.color = 'red'; return; }
        statusDiv.innerHTML = 'Se criptează fișierele... <div class="loader"></div>'; statusDiv.style.color = 'inherit';
        try {
            const encryptedFilesPayload = [];
            for (const file of this.filesToProcess) { statusDiv.innerHTML = `Criptez ${file.name}... <div class="loader"></div>`; const arrayBuffer = await file.arrayBuffer(); const encrypted = await cryptoUtils.encrypt(arrayBuffer, password); encryptedFilesPayload.push({ name: file.name, type: file.type, encryptedData: encrypted }); }
            const payloadString = JSON.stringify(encryptedFilesPayload);
            statusDiv.innerHTML = 'Se generează link-ul securizat... <div class="loader"></div>';
            const response = await fetch('/api/create-link', { method: 'POST', body: JSON.stringify({ clientName: clientName, encryptedPayload: payloadString }) });
            const result = await response.json(); if (!response.ok) { throw new Error(result.error || 'Eroare necunoscută de la server.'); }
            const fullLink = window.location.origin + result.link;
            statusDiv.innerHTML = `<p style="color:green; font-weight:bold;">Link generat cu succes!</p><input type="text" readonly value="${fullLink}" style="width: calc(100% - 24px); margin-top: 10px;"><button onclick="navigator.clipboard.writeText('${fullLink}')" class="button">Copiază Link</button>`;
            this.filesToProcess = []; document.getElementById('fileInput').value = ''; document.getElementById('fileList').innerHTML = ''; passwordInput.value = ''; passwordConfirmInput.value = ''; document.getElementById('passwordSection').classList.add('hidden');
            
            // Reîncarcă lista de link-uri pentru a afișa noul link adăugat
            this.loadLinks(); 

        } catch (error) { statusDiv.textContent = `Eroare critică: ${error.message}`; statusDiv.style.color = 'red'; }
    },

    async loadLinks() {
        const tableBody = document.querySelector("#linksTable tbody");
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Se încarcă...</td></tr>';

        try {
            const response = await fetch('/api/list-links', { cache: 'no-store' });
            if (!response.ok) throw new Error('Eroare la preluarea listei.');
            
            const links = await response.json();
            tableBody.innerHTML = ''; // Golește tabelul

            if (links.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nu există link-uri generate.</td></tr>';
                return;
            }

            links.forEach(link => {
                const row = tableBody.insertRow();
                const fullLink = window.location.origin + '/d/' + link.uniqueId;
                
                row.innerHTML = `
                    <td>${link.clientName}</td>
                    <td><a href="${fullLink}" target="_blank">${link.uniqueId}</a></td>
                    <td>${new Date(link.createdAt).toLocaleString('ro-RO')}</td>
                    <td>${link.downloadedAt ? new Date(link.downloadedAt).toLocaleString('ro-RO') : '...'}</td>
                    <td>
                        <button class="button-small" onclick="navigator.clipboard.writeText('${fullLink}')">Copiază</button>
                        <button class="button-small-delete" data-id="${link.uniqueId}">Șterge</button>
                    </td>
                `;
                // Adaugă event listener pentru butonul de ștergere
                row.querySelector('.button-small-delete').addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm(`Ești sigur că vrei să ștergi link-ul pentru ${link.clientName}?`)) {
                        this.deleteLink(id);
                    }
                });
            });

        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Eroare la încărcare: ${error.message}</td></tr>`;
        }
    },

    async deleteLink(id) {
        try {
            const response = await fetch('/api/delete-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            if (!response.ok) throw new Error('Eroare la ștergere pe server.');

            // Reîncarcă lista pentru a reflecta schimbările
            this.loadLinks();

        } catch (error) {
            alert(`Nu am putut șterge link-ul: ${error.message}`);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    adminApp.init();
});