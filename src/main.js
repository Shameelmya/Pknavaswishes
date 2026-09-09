import { jsPDF } from 'jspdf';

document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1>Letter Generator</h1>
    <p class="subtitle">Draft your professional letter and generate a high-quality PDF.</p>
    
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
      
      <button type="submit" id="generateBtn">
        Generate PDF
      </button>
    </form>
  </div>
`;

// Set default date to today
document.getElementById('date').valueAsDate = new Date();

// Helper to get Malayalam day
function getMalayalamDay(dateString) {
  const date = new Date(dateString);
  const days = [
    'ഞായറാഴ്ച',   // Sunday
    'തിങ്കളാഴ്ച',  // Monday
    'ചൊവ്വാഴ്ച',  // Tuesday
    'ബുധനാഴ്ച', // Wednesday
    'വ്യാഴാഴ്ച', // Thursday
    'വെള്ളിയാഴ്ച',// Friday
    'ശനിയാഴ്ച'  // Saturday
  ];
  return days[date.getDay()];
}

// Format date to DD/MM/YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function loadFontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font from ${url}`);
  const buffer = await response.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

document.getElementById('letterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = document.getElementById('generateBtn');
  btn.classList.add('loading');
  btn.innerText = 'Generating...';

  try {
    const dateInput = document.getElementById('date').value;
    const salutation = document.getElementById('salutation').value;
    const content = document.getElementById('content').value;
    const signature = document.getElementById('signature').value;

    const formattedDate = formatDate(dateInput);
    const malayalamDay = getMalayalamDay(dateInput);

    // Create jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add background image
    const imgUrl = `${import.meta.env.BASE_URL}Ashamsa Letter pad.png`;
    const imgElement = new Image();
    imgElement.src = imgUrl;
    await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = () => reject(new Error('Could not load background image. Ensure "Ashamsa Letter pad.png" is in the public folder.'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imgData = canvas.toDataURL('image/png');
    
    doc.addImage(imgData, 'PNG', 0, 0, 210, 297);

    // Add custom font
    try {
        const fontUrl = `${import.meta.env.BASE_URL}A10-Regular.ttf`;
        const fontBase64 = await loadFontAsBase64(fontUrl);
        doc.addFileToVFS('A10-Regular.ttf', fontBase64);
        doc.addFont('A10-Regular.ttf', 'A10', 'normal');
        doc.setFont('A10');
    } catch (fontErr) {
        console.warn('Font loading failed, falling back to default', fontErr);
        throw new Error('Could not load font. Ensure "A10-Regular.ttf" is in the public folder.');
    }
    
    // Set color (dark blue matching signature)
    doc.setTextColor(19, 36, 102);

    // Date
    doc.setFontSize(14);
    doc.text(formattedDate, 150, 65);
    doc.text(malayalamDay, 150, 72);
    
    // Salutation
    doc.setFontSize(16);
    doc.text(salutation, 30, 95);

    // Body Content
    const splitContent = doc.splitTextToSize(content, 150);
    doc.text(splitContent, 30, 115, { lineHeightFactor: 1.8 });

    // Signature
    const signatureLines = doc.splitTextToSize(signature, 80);
    // Rough estimate of Y position based on content length
    const yOffset = 115 + (splitContent.length * 8) + 30; 
    doc.text(signatureLines, 110, yOffset > 180 ? yOffset : 180, { lineHeightFactor: 1.5 });

    doc.save('Letter.pdf');
  } catch (error) {
    console.error(error);
    alert(error.message || 'An error occurred while generating the PDF.');
  } finally {
    btn.classList.remove('loading');
    btn.innerText = 'Generate PDF';
  }
});
