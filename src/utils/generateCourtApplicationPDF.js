import html2pdf from 'html2pdf.js'

export const generateCourtApplicationPDF = async (formData = {}) => {
  // ✅ Collect all uploaded files (if any)
  const uploadedFiles = []
  if (formData.documents) {
    Object.values(formData.documents).forEach(exhibitArray => {
      exhibitArray.forEach(file => uploadedFiles.push(file))
    })
  }
  // console.log('Uploaded Files:', uploadedFiles)

  // Create hidden container
  const container = document.createElement('div')
  container.style.display = 'none'
  document.body.appendChild(container)

  const exhibits = formData.exhibits || []

  // ---------------------- PAGE 1: Index ----------------------
  const page1 = `
    <div style="padding:5rem; font-family:'Times New Roman'; font-size:13px; line-height:1.5;">
      <div style="text-align:center; font-weight:bold;">
        <p>IN THE COURT OF HON'BLE SESSION FOR GREATER BOMBAY AT, MUMBAI</p>
        <p>SPECIAL COURT FOR PMLA CASES</p>
        <p>CRIMINAL APPLICATION/EXHIBIT NO. ____ OF 2025</p>
        <p>IN SPECIAL CASE NO. ____ OF 2025</p>
        <p>IN</p>
        <p>ECIR/MBZO-1//2025</p>
      </div>

      <div style="margin: 2rem 0;">
        <p><b>${formData.applicantName || ''}</b> ….. Applicant</p>
        <p>VERSUS</p>
        <p>DYANDHARA MULTISTATE CO-OPERATIVE CREDIT SOCIETY ….. <b>Accused</b></p>
        <p>DIRECTORATE OF ENFORCEMENT ….. <b>Complainant</b></p>
      </div>

      <h3 style="text-align:center; text-decoration:underline;">INDEX</h3>

      <table style="width:100%; border-collapse:collapse; border:1px solid black; font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid black; padding:6px;">SR. No.</th>
            <th style="border:1px solid black; padding:6px;">PARTICULARS</th>
            <th style="border:1px solid black; padding:6px;">EXHIBIT No.</th>
            <th style="border:1px solid black; padding:6px;">PAGE No.</th>
          </tr>
        </thead>
        <tbody>
          ${exhibits
            .map(
              (ex, i) => `
            <tr>
              <td style="border:1px solid black; text-align:center;">${i + 1}</td>
              <td style="border:1px solid black;">${ex.description || ''}</td>
              <td style="border:1px solid black; text-align:center;">${ex.title || ''}</td>
              <td style="border:1px solid black; text-align:center;"></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:2rem;">
        <div>
          <p><b>Place:</b> Mumbai</p>
          <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="text-align:right;">
          <p>___________________________</p>
          <p>Advocate for the Applicant</p>
        </div>
      </div>
    </div>
  `

  // ---------------------- PAGE 2: Applicant Info ----------------------
  const page2 = `
    <div style="page-break-before: always; padding:3rem; font-family:'Times New Roman'; font-size:12px;">
      <h3 style="text-align:center; text-decoration:underline;">APPLICATION DETAILS</h3>
      <p><b>Full Name:</b> ${formData.name || ''}</p>
      <p><b>Age:</b> ${formData.age || ''}</p>
      <p><b>Gender:</b> ${formData.gender || ''}</p>
      <p><b>Contact:</b> ${formData.phone_number || ''}</p>
      <p><b>Email:</b> ${formData.email || ''}</p>
      <p><b>Address:</b> ${formData.address || ''}</p>
      <p><b>Notes:</b> ${formData.notes || ''}</p>

      <p style="margin-top:1rem; font-style:italic;">
        I hereby affirm that the above information is true and correct to the best of my knowledge.
      </p>
      <div style="text-align:right; margin-top:2rem;">
        <p>_________________________</p>
        <p><b>Signature of Applicant</b></p>
      </div>
    </div>
  `

  // ---------------------- PAGE 3+: Exhibits ----------------------
  const exhibitPages = exhibits
    .map(
      ex => `
    <div style="page-break-before: always; padding:2rem; font-family:'Times New Roman'; font-size:12px;">
      <h3 style="text-align:center; text-decoration:underline;">${ex.title || ''}</h3>
      <p>${ex.description || ''}</p>
    </div>
  `
    )
    .join('')

  // Combine all
  container.innerHTML = page1 + page2 + exhibitPages

  // PDF options
  const options = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: 'Court_Application.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  }

  // Generate and return as ArrayBuffer
  const pdfInstance = await html2pdf().set(options).from(container).toPdf().get('pdf')
  const arrayBuffer = pdfInstance.output('arraybuffer')
  document.body.removeChild(container)
  return arrayBuffer
}
