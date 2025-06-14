function loadLogo(event) {
  const reader = new FileReader();
  reader.onload = e => document.getElementById("logoPreview").src = e.target.result;
  reader.readAsDataURL(event.target.files[0]);
}

function showHeaderInputs() {
  const count = parseInt(document.getElementById('lineCount').value);
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById('line' + i);
    input.style.display = i <= count ? 'block' : 'none';
    if (i > count) input.value = '';
  }
  updateHeaderLines();
}

function updateHeaderLines() {
  let lines = [];
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById('line' + i);
    if (input.style.display !== 'none' && input.value.trim()) {
      lines.push(input.value.trim());
    }
  }
const hallmarkElement = document.querySelector('.hallmark strong');

  const previewContainer = document.getElementById('headerLinesPreview');
  if (lines.length > 0) {
    let html = `<div style="text-align: center;">`;
    html += `<div style="font-weight:bold; font-size: 20px;">${lines[0]}</div>`;
    html += lines.slice(1).map(line => `<div>${line}</div>`).join('');
    html += `</div>`;
    previewContainer.innerHTML = html;
    hallmarkElement.textContent = lines[0];
    
  } else {
    previewContainer.innerHTML = '';
  }
}


function toggleGstFields() {
  const isGst = document.getElementById("isGstEnabled").checked;
  document.getElementById("gstNumberSection").style.display = isGst ? 'block' : 'none';

  const gstFields = document.querySelectorAll('.gst-field');
  gstFields.forEach(el => el.style.display = isGst ? 'table-cell' : 'none');

  // Show or hide GST number in invoice preview
  const gstDisplay = document.getElementById('gstNumberDisplay');
  if (isGst) {
    gstDisplay.style.display = 'block';
    gstDisplay.textContent = "GST Number: " + document.getElementById('gstNumber').value.trim();
  } else {
    gstDisplay.style.display = 'none';
    gstDisplay.textContent = '';
  }

  calculateInvoice();
}

// Add this after your other functions, so it updates live on input:
document.getElementById('gstNumber').addEventListener('input', function() {
  const gstDisplay = document.getElementById('gstNumberDisplay');
  if (document.getElementById('isGstEnabled').checked) {
    gstDisplay.textContent = "GST Number: " + this.value.trim();
  }
});


function addItem() {
  const isGst = document.getElementById("isGstEnabled").checked;
  const row = document.createElement('tr');

  row.innerHTML = `
    <td><input type="text" placeholder="Item Name"></td>
    <td><input type="number" value="1" min="1" class="qty" oninput="calculateInvoice()"></td>
    <td><input type="number" value="0" min="0" class="rate" oninput="calculateInvoice()"></td>
    ${isGst ? `
      <td><input type="number" value="9" class="cgst" oninput="calculateInvoice()"></td>
      <td><input type="number" value="9" class="sgst" oninput="calculateInvoice()"></td>
    ` : `
    `}
    <td class="total">0.00</td>
    <td class="no-print"><button  onclick="this.closest('tr').remove(); calculateInvoice()">❌</button></td>
  `;

  document.getElementById("itemsBody").appendChild(row);
  calculateInvoice();
}

function finalizeItems() {
  if (confirm("Are you sure you want to finalize the items? You won't be able to edit after this.")) {
    // Hide finalize button
    document.getElementById('finalizeBtn').style.display = 'none';

    // Show PDF download button
    document.getElementById('pdfBtn').style.display = 'block';

    // Disable all inputs and buttons in the invoice table
    const inputs = document.querySelectorAll('#itemsBody input');
    inputs.forEach(input => input.disabled = true);

    // Hide all remove buttons
    const removeButtons = document.querySelectorAll('#itemsBody button');
    removeButtons.forEach(btn => btn.style.display = 'none');

    // Also disable Add Item button and GST toggle, logo input, header inputs
    document.querySelector('.add-btn').disabled = true;  // Add Item button
    document.getElementById('isGstEnabled').disabled = true;
    document.getElementById('logoInput').disabled = true;

    for(let i=1; i<=5; i++) {
      let el = document.getElementById('line' + i);
      if(el) el.disabled = true;
    }
    document.getElementById('lineCount').disabled = true;
    document.getElementById('gstNumber').disabled = true;
  }
}

function calculateInvoice() {
  const rows = document.querySelectorAll('#itemsBody tr');
  const isGst = document.getElementById("isGstEnabled").checked;
  let grandTotal = 0, cgstSum = 0, sgstSum = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.qty')?.value || 0);
    const rate = parseFloat(row.querySelector('.rate')?.value || 0);
    const subtotal = qty * rate;

    let cgstAmt = 0, sgstAmt = 0;
    if (isGst) {
      const cgst = parseFloat(row.querySelector('.cgst')?.value || 0);
      const sgst = parseFloat(row.querySelector('.sgst')?.value || 0);
      cgstAmt = (subtotal * cgst) / 100;
      sgstAmt = (subtotal * sgst) / 100;
    }

    const total = subtotal + cgstAmt + sgstAmt;
    row.querySelector('.total').textContent = total.toFixed(2);

    cgstSum += cgstAmt;
    sgstSum += sgstAmt;
    grandTotal += total;
  });

  document.getElementById("cgstTotal").textContent = cgstSum.toFixed(2);
  document.getElementById("sgstTotal").textContent = sgstSum.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
}

function validateGstLive() {
  const gstInput = document.getElementById('gstNumber');
  const errorMsg = document.getElementById('gstError');
  const gst = gstInput.value.trim();
  // GST regex case-insensitive
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

  if (gst === "") {
    errorMsg.style.display = 'none';
    gstInput.classList.remove('invalid');
    gstInput.classList.remove('valid');
    return true;
  }

  if (!regex.test(gst)) {
    errorMsg.style.display = 'block';
    gstInput.classList.add('invalid');
    gstInput.classList.remove('valid');
    return false;
  } else {
    errorMsg.style.display = 'none';
    gstInput.classList.remove('invalid');
    gstInput.classList.add('valid');
    return true;
  }
}

function downloadInvoice() {
  if (document.getElementById("isGstEnabled").checked && !validateGstLive()) {
    alert("Please enter a valid GST Number before downloading the invoice.");
    return;
  }

  const preview = document.getElementById("logoPreview");
   if (preview.src =='') {
    preview.style.display = "none";
   }  

  // 🔴 Temporarily hide delete buttons/column before generating PDF
  const noPrintElements = document.querySelectorAll('.no-print');
  noPrintElements.forEach(el => el.style.display = 'none');

  // ✅ Generate PDF
  html2pdf().from(document.getElementById("invoice")).set({
    margin: 0.5,
    filename: 'smart-invoice.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).save().then(() => {
    // ✅ Show them back after save completes
    noPrintElements.forEach(el => el.style.display = '');
  });
}

// Set auto date on page load
document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('invoiceDate').textContent = `Date: ${formattedDate}`;

  // Initially show header inputs according to default select value
  showHeaderInputs();
});