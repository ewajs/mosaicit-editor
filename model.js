
const modelViewer = document.querySelector('model-viewer');

//// Modals
function launchModal(title, html, container) {
    Swal.fire({
        title,
        html,
        confirmButtonText: 'OK!',
        customClass: {
            container,
            confirmButton: 'btn',
        }
    })
}

// AR
document.getElementById('viewInAR').addEventListener('click', (e) => {
    if(modelViewer.canActivateAR) {
        modelViewer.querySelector('.ar-button').click();
        return;
    }
    // If user cannot use AR here, we prompt them to view in mobile device
    launchModal(
        'Abrílo en tu celular para verlo en Realidad Aumentada',
        '<div id="qr-code"></div>',
    );

    new QRCode(document.getElementById('qr-code'), {
        text: window.location.href,
        width: 256,
        height: 256,
        colorDark : '#202327',
        colorLight : '#e1e5eb',
        correctLevel : QRCode.CorrectLevel.H
      });
});

// Info
document.getElementById('info').addEventListener('click', () => {
    const innerHTML = `<div>
    <p><strong>Diseñadora:</strong> Ilanit Baldinger</p>
    <p><strong>Diámetro:</strong> 40cm</p>
    <p><strong>Peso:</strong> 700g</p></div>
    <p><strong>Precio:</strong> $-----</p></div>`;
    launchModal("Espejo con Venecitas", innerHTML);
});

// Help 
document.getElementById('help').addEventListener('click', () => {
    const innerHTML = `
        <h1>Controles</h1>
        <p><strong>Apuntar Cámara: </strong> Click / Tocar</p>
        <p><strong>Rotar Cámara: </strong> Click + Arrastrar / Deslizar</p>
        <p><strong>Zoom: </strong> Ruedita / Pellizcar</p>
        <h1>Realidad Aumentada</h1>
        <p><strong>Mover Modelo: </strong> Deslizar</p>
        <p><strong>Rotar Modelo: </strong> Dos dedos + Rotar</p>
        <p><strong>Zoomear Modelo: </strong> Pellizcar</p>
    `;
    launchModal('Ayuda', innerHTML, 'help-modal');
});

// Share
document.getElementById('share').addEventListener('click', (e) => {
    const shareData = {
        title: "Mosaic.it Realidad Aumentada",
        text: "Mirá este espejo!",
        url: window.location.href,
      };
    // If device has sharing enabled, we trigger native share
    if (navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData);
        return;
    }

    const shareTextContent = 'Copiá el link o escaneá el QR';
    const successCopyText = 'Copiado!';
    // Otherwhise modal with a link + QR
    // If user cannot use AR here, we prompt them to view in mobile device
    launchModal(
        'Compartir',
        `<div class="share-container">
            <p class="share-text">${shareTextContent}</p>
            <div class="share-link"><a href="#">${window.location.href}</a><i class="bi bi-clipboard"></i></div>
            <div id="qr-code"></div>
        </div>`,
        'share-modal'
    );

    const shareLink = document.querySelector('.share-link');
    const shareText = document.querySelector('.share-text');

    shareLink.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        const bi = shareLink.querySelector('.bi');
        bi.classList.remove('bi-clipboard');
        bi.classList.add('bi-clipboard-check');
        shareText.innerText = successCopyText;
        // Reset back after a while
        setTimeout(() => {
            shareText.innerText = shareTextContent;
            bi.classList.remove('bi-clipboard-check');
            bi.classList.add('bi-clipboard');
        }, 2000)
    });

    new QRCode(document.getElementById('qr-code'), {
        text: window.location.href,
        width: 256,
        height: 256,
        colorDark : '#68594a',
        colorLight : '#e4ddd7',
        correctLevel : QRCode.CorrectLevel.H
    });
});