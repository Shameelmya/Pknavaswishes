import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Inject dynamic font-face for GitHub Pages
const style = document.createElement('style');
style.innerHTML = `
@font-face {
  font-family: 'A10';
  src: url('${import.meta.env.BASE_URL}A10-Regular.ttf') format('truetype');
}
`;
document.head.appendChild(style);

document.querySelector('#app').innerHTML = `
  <div class="app-wrapper">
    <div class="container">
      <h1>Letter Generator</h1>
      <p class="subtitle">Enter your details to preview the letter. The browser will perfectly render Malayalam characters.</p>
      
      <form id="letterForm">
        <div class="form-group">
          <label for="date">Date</label>
          <input type="date" id="date" class="form-control" required />
        </div>
        
        <div class="form-group">
          <label for="salutation">Salutation</label>
          <input type="text" id="salutation" class="form-control" value="പ്രിയപ്പെട്ട ജുബിനക്കും സഹദിനും" required />
        </div>
        
        <div class="form-group">
          <label for="content">Body Content</label>
          <textarea id="content" class="form-control" rows="6" required>നിങ്ങൾക്ക് എന്റെ ഹൃദയം നിറഞ്ഞ വിവാഹമംഗളാശംസകൾ!

നിങ്ങളുടെ ഈ പുതിയ തുടക്കം സ്നേഹവും സന്തോഷവും സമാധാനവും നിറഞ്ഞതായിരിക്കട്ടെ. പരസ്പരം തുണയായും കരുത്തായും ജീവിതത്തിലെ എല്ലാ നിമിഷങ്ങളിലും ഒന്നിച്ച് മുന്നേറാൻ നിങ്ങൾക്ക് സാധിക്കട്ടെ എന്ന് ആശംസിക്കുന്നു. സർവ്വശക്തന്റെ എല്ലാവിധ അനുഗ്രഹങ്ങളും എപ്പോഴും കൂടെയുണ്ടാകട്ടെ.</textarea>
        </div>

        <div class="form-group">
          <label for="signature">Signature</label>
          <textarea id="signature" class="form-control" rows="2" required>സ്നേഹാശംസകളോടെ,
പി. കെ. നവാസ് എം എൽ എ</textarea>
        </div>
        
        <button type="button" id="previewBtn">
          Preview Letter
        </button>
      </form>
    </div>

    <div class="preview-container" id="previewContainer" style="display: none;">
      <div class="preview-wrapper">
        <div id="letterPreview" class="letter-preview">
          <img src="${import.meta.env.BASE_URL}Ashamsa Letter pad.png" class="bg-img" crossorigin="anonymous" />
          <div class="letter-content-wrapper">
            <div class="letter-text date-block" id="prevDate"></div>
            <div class="letter-text salutation-block" id="prevSalutation"></div>
            <div class="letter-text content-block" id="prevContent"></div>
            <div class="letter-text signature-block" id="prevSignature"></div>
          </div>
        </div>
      </div>
      <button type="button" id="downloadBtn" class="secondary">
        Download PDF
      </button>
    </div>
  </div>
`;

document.getElementById('date').valueAsDate = new Date();

function getMalayalamDay(dateString) {
  const date = new Date(dateString);
  const days = ['ഞായറാഴ്ച', 'തിങ്കളാഴ്ച', 'ചൊവ്വാഴ്ച', 'ബുധനാഴ്ച', 'വ്യാഴാഴ്ച', 'വെള്ളിയാഴ്ച', 'ശനിയാഴ്ച'];
  return days[date.getDay()];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Fit preview scale to screen
function adjustPreviewScale() {
  const preview = document.getElementById('letterPreview');
  const wrapper = document.querySelector('.preview-wrapper');
  if (wrapper && preview) {
    const wrapperWidth = wrapper.clientWidth;
    if (wrapperWidth < 794) {
      const scale = wrapperWidth / 820;
      preview.style.transform = `scale(${scale})`;
      preview.style.marginBottom = `-${1123 * (1 - scale)}px`;
    } else {
      preview.style.transform = 'scale(1)';
      preview.style.marginBottom = '0px';
    }
  }
}

window.addEventListener('resize', adjustPreviewScale);

// Preview Action
document.getElementById('previewBtn').addEventListener('click', () => {
  const dateInput = document.getElementById('date').value;
  const salutation = document.getElementById('salutation').value;
  const content = document.getElementById('content').value;
  const signature = document.getElementById('signature').value;

  if (!dateInput || !salutation || !content || !signature) {
    alert("Please fill in all fields.");
    return;
  }

  const formattedDate = formatDate(dateInput);
  const malayalamDay = getMalayalamDay(dateInput);

  document.getElementById('prevDate').innerText = `${formattedDate}\n${malayalamDay}`;
  document.getElementById('prevSalutation').innerText = salutation;
  document.getElementById('prevContent').innerText = content;
  document.getElementById('prevSignature').innerText = signature;

  document.getElementById('previewContainer').style.display = 'flex';
  
  // Wait a tick for display to compute layout
  setTimeout(() => {
      adjustPreviewScale();
      document.getElementById('previewContainer').scrollIntoView({ behavior: 'smooth' });
  }, 50);
});

// Download Action using HTML2Canvas
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('downloadBtn');
  btn.classList.add('loading');
  btn.innerText = 'Generating PDF...';

  try {
    const previewElement = document.getElementById('letterPreview');
    // Temporarily reset transform so html2canvas renders full resolution
    const oldTransform = previewElement.style.transform;
    previewElement.style.transform = 'none';

    // Make sure background image is fully loaded before rendering
    const canvas = await html2canvas(previewElement, {
      scale: 2, // High quality scale
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // Restore scale
    previewElement.style.transform = oldTransform;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    pdf.save('Letter.pdf');
  } catch (err) {
    console.error(err);
    alert('Failed to generate PDF. Make sure images are loaded.');
  } finally {
    btn.classList.remove('loading');
    btn.innerText = 'Download PDF';
  }
});
