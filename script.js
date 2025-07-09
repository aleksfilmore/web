document.addEventListener('DOMContentLoaded', () => {
    function setupModal(modal, openBtn, closeBtn) {
        if (!modal || !openBtn || !closeBtn) return;
        
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    const secretChapterModal = document.getElementById('secret-chapter-modal');
    const openSecretChapterBtn = document.getElementById('open-secret-chapter-modal');
    const closeSecretChapterBtn = secretChapterModal.querySelector('.modal-close');
    
    setupModal(secretChapterModal, openSecretChapterBtn, closeSecretChapterBtn);
});
