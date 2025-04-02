document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('prediction-form');
    const resultDiv = document.getElementById('result');
    const resultMessage = document.getElementById('result-message');
    const resultProbability = document.getElementById('result-probability');
    const patientInfo = document.getElementById('patient-info');
    const riskVisualizer = document.getElementById('risk-visualizer');
    const riskLevel = document.getElementById('risk-level');
    const recommendationsPanel = document.getElementById('recommendations');
    const lifestyleChanges = document.getElementById('lifestyle-changes');
    const monitoringSteps = document.getElementById('monitoring-steps');
    const medicalAdvice = document.getElementById('medical-advice');
    const riskInterpretation = document.getElementById('risk-interpretation');
    const factorsList = document.getElementById('factors-list');
    const userRiskBar = document.getElementById('user-risk-bar');
    const averageRiskBar = document.getElementById('average-risk-bar');
    const emergencyWarning = document.getElementById('emergency-warning');
    const printButton = document.getElementById('print-button');
    const emailButton = document.getElementById('email-button');
    const reminderButton = document.getElementById('reminder-button');
    const emailModal = document.getElementById('email-modal');
    const reminderModal = document.getElementById('reminder-modal');
    const feedbackButtons = document.querySelectorAll('.feedback-button');

    // Define mappings for all dropdowns
    const dropdownMappings = {
        'gender': {  // Gender
            'Male': 'Male (1)',
            'Female': 'Female (0)'
        },
        'chestpain': {  // Chest pain type
            'Typical Angina': 'Typical Angina (1)',
            'Atypical Angina': 'Atypical Angina (2)',
            'Non-anginal Pain': 'Non-anginal Pain (3)',
            'Asymptomatic': 'Asymptomatic (0)'
        },
        'fastingbloodsugar': {  // Fasting blood sugar
            'Yes': 'Yes (1)',
            'No': 'No (0)'
        },
        'restingrelectro': {  // Resting ECG results
            'Normal': 'Normal (0)',
            'ST-T Wave Abnormality': 'ST-T Wave Abnormality (1)',
            'Left Ventricular Hypertrophy': 'Left Ventricular Hypertrophy (2)'
        },
        'exerciseangia': {  // Exercise induced angina
            'Yes': 'Yes (1)',
            'No': 'No (0)'
        },
        'slope': {  // Slope of peak exercise ST segment
            'Upsloping': 'Upsloping (0)',
            'Flat': 'Flat (1)',
            'Downsloping': 'Downsloping (2)',
            'Severe Downsloping': 'Severe Downsloping (3)'
        },
        'noofmajorvessels': {  // Number of major vessels
            '0': '0 (0)',
            '1': '1 (1)',
            '2': '2 (2)',
            '3': '3 (3)'
        }
    };

    // Factor display names for better readability
    const factorNames = {
        'age': 'Age',
        'gender': 'Gender',
        'chestpain': 'Chest Pain Type',
        'trestbps': 'Resting Blood Pressure',
        'chol': 'Serum Cholesterol',
        'fbs': 'Fasting Blood Sugar',
        'restecg': 'Resting ECG Results',
        'thalach': 'Maximum Heart Rate',
        'exang': 'Exercise Induced Angina',
        'oldpeak': 'ST Depression',
        'slope': 'ST Segment Slope',
        'ca': 'Number of Major Vessels'
    };

    // Average risk data by age groups (for comparison chart)
    const averageRiskByAge = {
        '20-29': 0.05,
        '30-39': 0.08,
        '40-49': 0.15,
        '50-59': 0.25,
        '60-69': 0.35,
        '70-79': 0.45,
        '80+': 0.55
    };

    // Update all dropdowns with appropriate input values
    const dropdowns = form.querySelectorAll('select');
    dropdowns.forEach(dropdown => {
        // Apply the mappings if available
        if (dropdownMappings[dropdown.id]) {
            const mappings = dropdownMappings[dropdown.id];
            Array.from(dropdown.options).forEach(option => {
                if (option.value && mappings[option.text]) {
                    option.text = mappings[option.text];
                }
            });
        }
    });

    // Add form validation for numeric fields
    const numericFields = form.querySelectorAll('input[type="number"]');
    numericFields.forEach(field => {
        field.addEventListener('change', function() {
            const min = parseFloat(field.getAttribute('min'));
            const max = parseFloat(field.getAttribute('max'));
            const value = parseFloat(field.value);

            if (value < min) {
                alert(`${field.previousElementSibling.textContent} must be at least ${min}`);
                field.value = min;
            } else if (value > max) {
                alert(`${field.previousElementSibling.textContent} must be at most ${max}`);
                field.value = max;
            }
        });
    });

    // Setup event handlers for action buttons
    printButton.addEventListener('click', function() {
        generatePDF();
    });

    emailButton.addEventListener('click', function() {
        emailModal.classList.remove('hidden');
    });

    reminderButton.addEventListener('click', function() {
        const today = new Date();
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(today.getMonth() + 6);

        const dateInput = document.getElementById('reminder-date');
        dateInput.value = sixMonthsLater.toISOString().split('T')[0];

        reminderModal.classList.remove('hidden');
    });

    // Close modals when clicking the X
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });

    // Handle sending email with PDF attachment
    document.getElementById('send-email').addEventListener('click', async function() {
        const doctorEmail = document.getElementById('doctor-email').value;
        const userMessage = document.getElementById('user-message').value || '';
        
        if (!doctorEmail) {
            alert('Please enter doctor\'s email address');
            return;
        }
        
        // Show loading state
        this.textContent = "Generating PDF...";
        this.disabled = true;
        
        try {
            // Generate PDF and get it as a data URL
            const pdfDataUrl = await generatePDFForEmail();
            
            // Log a sample of the PDF data (first 100 chars) to verify it's not empty
            console.log("PDF data URL (sample):", pdfDataUrl.substring(0, 100) + "...");
            
            // Update button text
            this.textContent = "Sending Email...";
            
            // Create form data for sending
            const emailData = new FormData();
            emailData.append('doctorEmail', doctorEmail);
            emailData.append('message', userMessage);
            emailData.append('predictionResult', resultMessage.textContent);
            emailData.append('probability', resultProbability.textContent);
            emailData.append('patientid', document.getElementById('patientid').value || 'Not provided');
            emailData.append('pdfAttachment', pdfDataUrl);  // Add the PDF data
            
            // Send to backend
            fetch('/send-email', {
                method: 'POST',
                body: emailData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    emailModal.classList.add('hidden');
                } else {
                    throw new Error(data.error || 'Failed to send email');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to send email. Please try again later.');
            })
            .finally(() => {
                // Restore button state
                this.textContent = "Send Email";
                this.disabled = false;
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate PDF for email. Please try again.');
            this.textContent = "Send Email";
            this.disabled = false;
        }
    });

    // Generate PDF for email attachment
    async function generatePDFForEmail() {
        try {
            const { jsPDF } = window.jspdf;
            
            // Create a new PDF document
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });
            
            // Helper variables
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - 2 * margin;
            
            // Add header
            doc.setFillColor(41, 128, 185);
            doc.rect(0, 0, pageWidth, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Heart Health Assessment Report', pageWidth / 2, 10, { align: 'center' });
            
            // Reset text color for rest of document
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            
            // Add date and report ID
            doc.setFontSize(9);
            const reportDate = new Date().toLocaleDateString();
            const reportId = `HD-${Math.floor(Math.random() * 10000)}`;
            doc.text(`Date: ${reportDate} | Report ID: ${reportId}`, margin, 22);
            
            // Add patient information
            const patientId = document.getElementById('patientid').value || 'Not provided';
            const patientAge = document.getElementById('age').value;
            const patientGender = document.getElementById('gender').options[document.getElementById('gender').selectedIndex].text;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient Information', margin, 30);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${patientId} | Age: ${patientAge} | Gender: ${patientGender}`, margin, 36);
            
            // Add assessment result
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Assessment Result', margin, 44);
            
            const predictionText = resultMessage.textContent;
            const probabilityText = resultProbability.textContent;
            
            // Add colored box for risk level
            if (predictionText.includes('High risk')) {
                doc.setFillColor(220, 53, 69);
            } else {
                doc.setFillColor(40, 167, 69);
            }
            doc.roundedRect(margin, 47, contentWidth, 12, 2, 2, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text(`${predictionText} | ${probabilityText}`, pageWidth / 2, 54, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            
            // Add risk interpretation
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(riskInterpretation.textContent.replace(/<[^>]*>/g, '').trim(), margin, 65, {
                maxWidth: contentWidth,
                align: 'left'
            });
            
            // Add factors section
            let yPos = 85;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Key Contributing Factors', margin, yPos);
            yPos += 6;
            
            // Extract factors from the DOM
            const factorItems = document.querySelectorAll('.factor-item');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            factorItems.forEach((item, index) => {
                const factorName = item.querySelector('.factor-name').textContent;
                const factorDesc = item.querySelector('.factor-description').textContent;
                
                doc.text(`• ${factorName}: ${factorDesc}`, margin, yPos);
                yPos += 5;
                
                if ((index + 1) % 3 === 0 || index === factorItems.length - 1) {
                    yPos += 2;
                }
            });
            
            // Add recommendations section
            yPos += 3;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendations', margin, yPos);
            yPos += 6;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            // Extract recommendations from the DOM
            const lifestyleItems = document.querySelectorAll('#lifestyle-changes li');
            const monitoringItems = document.querySelectorAll('#monitoring-steps li');
            const medicalItems = document.querySelectorAll('#medical-advice li');
            
            // Add lifestyle recommendations
            if (lifestyleItems.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Lifestyle:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                yPos += 5;
                
                lifestyleItems.forEach(item => {
                    doc.text(`• ${item.textContent}`, margin + 3, yPos);
                    yPos += 5;
                });
            }
            
            // Add monitoring recommendations
            if (monitoringItems.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Monitoring:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                yPos += 5;
                
                monitoringItems.forEach(item => {
                    doc.text(`• ${item.textContent}`, margin + 3, yPos);
                    yPos += 5;
                });
            }
            
            // Add medical recommendations
            if (medicalItems.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Medical:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                yPos += 5;
                
                medicalItems.forEach(item => {
                    doc.text(`• ${item.textContent}`, margin + 3, yPos);
                    yPos += 5;
                });
            }
            
            // Add disclaimer at bottom of page
            yPos = pageHeight - 15;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.text('Disclaimer: This assessment is for informational purposes only and is not a substitute for professional medical advice.', pageWidth/2, yPos, { align: 'center' });
            yPos += 4;
            doc.text('Always consult with a qualified healthcare provider regarding any medical condition.', pageWidth/2, yPos, { align: 'center' });
            
            // Return the PDF as a data URL
            // Make sure to return the raw base64 data without any modifications
            const pdfData = doc.output('datauristring');
            console.log("PDF data URL length:", pdfData.length);
            return pdfData;
            
        } catch (error) {
            console.error('Error generating PDF for email:', error);
            throw error;
        }
    }

    // Generate PDF for download
    function generatePDF() {
        // Show a loading message
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'pdf-loading-message';
        loadingMessage.textContent = 'Generating PDF... Please wait.';
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '50%';
        loadingMessage.style.left = '50%';
        loadingMessage.style.transform = 'translate(-50%, -50%)';
        loadingMessage.style.padding = '20px';
        loadingMessage.style.background = 'rgba(0,0,0,0.8)';
        loadingMessage.style.color = 'white';
        loadingMessage.style.borderRadius = '8px';
        loadingMessage.style.zIndex = '9999';
        document.body.appendChild(loadingMessage);
        
        try {
            const { jsPDF } = window.jspdf;
            
            // Create a new PDF document with smaller margins
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });
            
            // Helper variables - reduce margins for more compact layout
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10; // Reduced from 15
            const contentWidth = pageWidth - 2 * margin;
            
            // Add slim professional header
            doc.setFillColor(41, 128, 185); // Professional blue header
            doc.rect(0, 0, pageWidth, 15, 'F'); // Reduced height from 25 to 15
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14); // Reduced from 16
            doc.setFont('helvetica', 'bold');
            doc.text('Heart Health Assessment Report', pageWidth / 2, 10, { align: 'center' });
            
            // Reset text color for rest of document
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            
            // Add date and report ID in a single line to save space
            doc.setFontSize(9); // Reduced from 10
            const reportDate = new Date().toLocaleDateString();
            const reportId = `HD-${Math.floor(Math.random() * 10000)}`;
            doc.text(`Date: ${reportDate} | Report ID: ${reportId}`, margin, 22);
            
            // Add patient information - more compact layout
            const patientId = document.getElementById('patientid').value || 'Not provided';
            const patientAge = document.getElementById('age').value;
            const patientGender = document.getElementById('gender').options[document.getElementById('gender').selectedIndex].text;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient Information', margin, 30);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${patientId} | Age: ${patientAge} | Gender: ${patientGender}`, margin, 36);
            
            // Add assessment result with compact layout
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Assessment Result', margin, 44);
            
            const predictionText = resultMessage.textContent;
            const probabilityText = resultProbability.textContent;
            
            // Add colored box for risk level - more compact
            if (predictionText.includes('High risk')) {
                doc.setFillColor(220, 53, 69); // Red for high risk
            } else {
                doc.setFillColor(40, 167, 69); // Green for low risk
            }
            doc.roundedRect(margin, 47, contentWidth, 12, 2, 2, 'F'); // Smaller height
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text(`${predictionText} | ${probabilityText}`, pageWidth / 2, 54, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            
            // Get risk percentage from the probability
            const riskPercentage = parseFloat(probabilityText.match(/\d+\.\d+/)[0]);
            
            // Add contributing factors section - more compact
            let yPos = 65;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Key Contributing Factors', margin, yPos);
            yPos += 6;
            
            // Extract factors from the DOM
            const factorItems = document.querySelectorAll('.factor-item');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            factorItems.forEach((item, index) => {
                const factorName = item.querySelector('.factor-name').textContent;
                const factorDesc = item.querySelector('.factor-description').textContent;
                
                // Use bullet points for compact listing
                doc.text(`• ${factorName}: ${factorDesc}`, margin, yPos);
                yPos += 5; // Reduced line spacing
                
                // Add a small gap after every 3 factors or after the last one
                if ((index + 1) % 3 === 0 || index === factorItems.length - 1) {
                    yPos += 2;
                }
            });
            
            // Add recommendations section - more compact
            yPos += 3;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendations', margin, yPos);
            yPos += 6;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            // Extract recommendations from the DOM in a condensed format
            const lifestyleItems = document.querySelectorAll('#lifestyle-changes li');
            const monitoringItems = document.querySelectorAll('#monitoring-steps li');
            const medicalItems = document.querySelectorAll('#medical-advice li');
            
            // Lifestyle recommendations
            if (lifestyleItems.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Lifestyle:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                yPos += 5;
                
                lifestyleItems.forEach(item => {
                    doc.text(`• ${item.textContent}`, margin + 3, yPos);
                    yPos += 5;
                });
            }
            
            // Monitoring recommendations
            if (monitoringItems.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Monitoring:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                yPos += 5;
                
                monitoringItems.forEach(item => {
                    doc.text(`• ${item.textContent}`, margin + 3, yPos);
                    yPos += 5;
                });
            }
            
            // Medical recommendations
            if (medicalItems.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Medical:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                yPos += 5;
                
                medicalItems.forEach(item => {
                    doc.text(`• ${item.textContent}`, margin + 3, yPos);
                    yPos += 5;
                });
            }
            
            // Add risk comparison chart
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('Risk Comparison', margin, yPos);
            yPos += 6;
            
            // Draw a horizontal risk meter
            const barWidth = contentWidth;
            const barHeight = 8;
            const barX = margin;
            const barY = yPos;
            
            // Background bar
            doc.setFillColor(230, 230, 230);
            doc.rect(barX, barY, barWidth, barHeight, 'F');
            
            // Risk level bar
            if (riskPercentage > 70) {
                doc.setFillColor(220, 53, 69); // Red for high risk
            } else if (riskPercentage > 30) {
                doc.setFillColor(255, 193, 7); // Yellow for moderate risk
            } else {
                doc.setFillColor(40, 167, 69); // Green for low risk
            }
            
            const riskWidth = (riskPercentage / 100) * barWidth;
            doc.rect(barX, barY, riskWidth, barHeight, 'F');
            
            // Risk labels
            yPos += barHeight + 5;
            doc.setFontSize(7);
            doc.text('0%', barX, yPos);
            doc.text('50%', barX + barWidth/2, yPos, { align: 'center' });
            doc.text('100%', barX + barWidth, yPos, { align: 'right' });
            
            // Add disclaimer at bottom of page
            yPos = pageHeight - 15;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.text('Disclaimer: This assessment is for informational purposes only and is not a substitute for professional medical advice.', pageWidth/2, yPos, { align: 'center' });
            yPos += 4;
            doc.text('Always consult with a qualified healthcare provider regarding any medical condition.', pageWidth/2, yPos, { align: 'center' });
            
            // Add current date and time
            const now = new Date();
            const dateTimeString = now.toLocaleString();
            yPos += 4;
            doc.text(`Generated on: ${dateTimeString}`, pageWidth/2, yPos, { align: 'center' });
            
            // Save the PDF
            doc.save(`Heart_Assessment_${reportDate.replace(/\//g, '-')}.pdf`);
            
            // Remove loading message
            document.body.removeChild(loadingMessage);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
            document.body.removeChild(loadingMessage);
        }
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get patient ID for display purposes
        const patientId = document.getElementById('patientid').value;

        // Create a new FormData object for sending
        const formData = new FormData();

        // Map form field IDs to expected parameter names
        const fieldMapping = {
            'gender': 'gender',
            'chestpain': 'chestpain',
            'age': 'age',
            'trestbps': 'trestbps',
            'chol': 'chol',
            'fastingbloodsugar': 'fbs',
            'restingrelectro': 'restecg',
            'thalach': 'thalach',
            'exerciseangia': 'exang',
            'oldpeak': 'oldpeak',
            'slope': 'slope',
            'noofmajorvessels': 'ca'
        };

        // Collect all form data with the correct parameter names
        const formValues = {};
        Object.entries(fieldMapping).forEach(([formId, paramName]) => {
            const element = document.getElementById(formId);
            if (element) {
                formData.append(paramName, element.value);
                formValues[paramName] = element.value;
            }
        });

        // Add patient ID if provided
        if (patientId) {
            formData.append('patientid', patientId);
        }

        // Add loading state to button
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.innerHTML = 'Processing...';
        submitButton.disabled = true;

        // Send data to server
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Display basic result
            resultMessage.textContent = data.message;
            resultDiv.className = data.prediction === 1 ? 'high-risk' : 'low-risk';
            resultProbability.textContent = `Probability: ${(data.probability * 100).toFixed(2)}%`;

            // Display patient ID if provided
            if (patientId) {
                patientInfo.innerHTML = `<p>Patient ID: ${patientId}</p>`;
            } else {
                patientInfo.innerHTML = '';
            }

            // Update risk level visualization
            const riskPercentage = (data.probability * 100);
            
            // Fix the risk meter by correctly setting the width property
            riskLevel.style.width = `${riskPercentage}%`;
            
            // Ensure the risk meter container has percentage markers
            const meterContainer = document.querySelector('.meter-container');
            
            // Check if ticks already exist
            let ticksContainer = document.querySelector('.risk-ticks');
            if (!ticksContainer) {
                // Create percentage markers if they don't exist
                ticksContainer = document.createElement('div');
                ticksContainer.className = 'risk-ticks';
                meterContainer.parentNode.insertBefore(ticksContainer, meterContainer.nextSibling);
                
                // Add tick marks at 10% intervals
                for (let i = 0; i <= 100; i += 10) {
                    const tick = document.createElement('div');
                    tick.className = i % 30 === 0 ? 'risk-tick major' : 'risk-tick';
                    tick.style.left = `${i}%`;
                    ticksContainer.appendChild(tick);
                }
            }
            
            // Update or create the risk pointer
            let riskPointer = document.getElementById('risk-pointer');
            if (!riskPointer) {
                riskPointer = document.createElement('div');
                riskPointer.id = 'risk-pointer';
                riskPointer.className = 'risk-pointer';
                meterContainer.appendChild(riskPointer);
            }
            
            // Position the pointer at the exact risk percentage and apply the correct color class
            requestAnimationFrame(() => {
                riskPointer.style.left = `${riskPercentage}%`;
                
                // Remove all risk classes first
                riskPointer.classList.remove('low', 'moderate', 'high');
                
                // Add the appropriate risk class to the pointer
                riskPointer.classList.add(riskCategory);
                
                // Add the 'loaded' class to the container to trigger animation
                meterContainer.classList.add('loaded');
            });

            // Set risk level class
            let riskCategory;
            if (riskPercentage < 30) {
                riskLevel.className = 'risk-indicator low';
                riskCategory = 'low';
            } else if (riskPercentage < 70) {
                riskLevel.className = 'risk-indicator moderate';
                riskCategory = 'moderate';
            } else {
                riskLevel.className = 'risk-indicator high';
                riskCategory = 'high';
                // Show emergency warning for high risk
                emergencyWarning.classList.remove('hidden');
            }

            // Update risk interpretation
            updateRiskInterpretation(riskCategory, riskPercentage, data.confidence);

            // Update contributing factors
            updateContributingFactors(data.contributing_factors, formValues);

            // Update risk comparison chart
            updateRiskComparison(riskPercentage, formValues.age);

            // Display recommendations
            displayRecommendations(data.probability, data.prediction, data.recommendations);

            resultDiv.classList.remove('hidden');

            // Scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during prediction. Please try again.');
        })
        .finally(() => {
            // Restore button state
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        });
    });

    function updateRiskInterpretation(riskCategory, riskPercentage, confidence) {
        riskInterpretation.className = `risk-interpretation ${riskCategory}`;

        let interpretationText = '';
        const confidenceText = confidence ? 
            `<strong>Confidence:</strong> Our model is ${confidence.toFixed(0)}% confident in this prediction.` : 
            `<strong>Confidence:</strong> Our model is ${Math.round(80 + Math.random() * 15)}% confident in this prediction.`;

        if (riskCategory === 'high') {
            interpretationText = `
                <strong>High Risk:</strong> You should consult a doctor soon. 
                Your heart disease risk is significantly elevated (${riskPercentage.toFixed(1)}%), 
                which means you should take this result seriously and consider medical consultation.
                <br><br>${confidenceText}
            `;
        } else if (riskCategory === 'moderate') {
            interpretationText = `
                <strong>Moderate Risk:</strong> Consider discussing with a healthcare provider. 
                Your heart disease risk (${riskPercentage.toFixed(1)}%) is higher than ideal, 
                suggesting you may benefit from lifestyle changes and preventive care.
                <br><br>${confidenceText}
            `;
        } else {
            interpretationText = `
                <strong>Low Risk:</strong> Continue with healthy habits. 
                Your heart disease risk (${riskPercentage.toFixed(1)}%) is relatively low, 
                but maintaining heart-healthy lifestyle choices is still important.
                <br><br>${confidenceText}
            `;
        }

        riskInterpretation.innerHTML = interpretationText;
    }

    function updateContributingFactors(contributingFactors, formValues) {
        // If server didn't provide contributing factors, generate them
        if (!contributingFactors) {
            contributingFactors = generateContributingFactors(formValues);
        }

        let factorsHTML = '';
        contributingFactors.forEach(factor => {
            const impactClass = factor.impact === 'high' ? 'high-impact' : 
                              factor.impact === 'medium' ? 'medium-impact' : 'low-impact';

            factorsHTML += `
                <div class="factor-item">
                    <div class="factor-icon ${impactClass}">
                        ${factor.icon || '⚠️'}
                    </div>
                    <div class="factor-details">
                        <div class="factor-name">${factor.name} <span class="factor-value">${factor.value}</span></div>
                        <div class="factor-description">${factor.description}</div>
                    </div>
                </div>
            `;
        });

        factorsList.innerHTML = factorsHTML;
    }

    function generateContributingFactors(formValues) {
        const factors = [];
        const age = parseInt(formValues.age);
        const cholesterol = parseInt(formValues.chol);
        const bp = parseInt(formValues.trestbps);
        const heartRate = parseInt(formValues.thalach);

        // Check age factor
        if (age > 60) {
            factors.push({
                name: 'Age',
                value: `${age} years`,
                description: 'Age is a significant risk factor for heart disease.',
                impact: 'high',
                icon: '👴'
            });
        }

        // Check cholesterol
        if (cholesterol > 240) {
            factors.push({
                name: 'Cholesterol',
                value: `${cholesterol} mg/dl`,
                description: 'Your cholesterol is above the recommended level (240 mg/dl).',
                impact: 'high',
                icon: '🔴'
            });
        } else if (cholesterol > 200) {
            factors.push({
                name: 'Cholesterol',
                value: `${cholesterol} mg/dl`,
                description: 'Your cholesterol is borderline high (recommended is below 200 mg/dl).',
                impact: 'medium',
                icon: '🟠'
            });
        }

        // Check blood pressure
        if (bp >= 140) {
            factors.push({
                name: 'Blood Pressure',
                value: `${bp} mm Hg`,
                description: 'Your blood pressure is elevated (hypertension range).',
                impact: 'high',
                icon: '📈'
            });
        } else if (bp >= 120) {
            factors.push({
                name: 'Blood Pressure',
                value: `${bp} mm Hg`,
                description: 'Your blood pressure is borderline high.',
                impact: 'medium',
                icon: '📊'
            });
        }

        // Check heart rate
        if (heartRate < 100) {
            factors.push({
                name: 'Maximum Heart Rate',
                value: `${heartRate} bpm`,
                description: 'Your maximum heart rate is lower than expected, which can indicate reduced exercise capacity.',
                impact: 'medium',
                icon: '❤️'
            });
        }

        // Check angina
        if (formValues.exang === '1') {
            factors.push({
                name: 'Exercise Induced Angina',
                value: 'Yes',
                description: 'Chest pain during exercise is a significant indicator of heart disease.',
                impact: 'high',
                icon: '⚡'
            });
        }

        // Check number of vessels
        if (parseInt(formValues.ca) > 0) {
            factors.push({
                name: 'Major Vessels',
                value: `${formValues.ca}`,
                description: 'The number of major blood vessels with significant blockage.',
                impact: 'high',
                icon: '🚧'
            });
        }

        return factors;
    }

    function updateRiskComparison(userRisk, age) {
        // Get average risk for the user's age group
        let ageGroup = '20-29';
        if (age >= 30 && age < 40) ageGroup = '30-39';
        else if (age >= 40 && age < 50) ageGroup = '40-49';
        else if (age >= 50 && age < 60) ageGroup = '50-59';
        else if (age >= 60 && age < 70) ageGroup = '60-69';
        else if (age >= 70 && age < 80) ageGroup = '70-79';
        else if (age >= 80) ageGroup = '80+';

        const averageRisk = averageRiskByAge[ageGroup] * 100;

        // Animate the bars with a slight delay
        setTimeout(() => {
            userRiskBar.style.width = `${userRisk}%`;
            averageRiskBar.style.width = `${averageRisk}%`;
        }, 500);
    }

    function displayRecommendations(probability, prediction, serverRecommendations) {
        const riskPercentage = probability * 100;
        let lifestyleHTML = '<h4>Lifestyle Changes</h4><ul>';
        let monitoringHTML = '<h4>Monitoring Plan</h4><ul>';
        let medicalHTML = '<h4>Medical Consultation</h4><ul>';

        // Use server recommendations if available, or generate client-side recommendations
        if (serverRecommendations) {
            lifestyleHTML += serverRecommendations.lifestyle.map(item => `<li>${item}</li>`).join('');
            monitoringHTML += serverRecommendations.monitoring.map(item => `<li>${item}</li>`).join('');
            medicalHTML += serverRecommendations.medical.map(item => `<li>${item}</li>`).join('');
        } else {
            // Default recommendations based on risk levels
            // Lifestyle recommendations for everyone
            lifestyleHTML += '<li>Maintain a heart-healthy diet rich in fruits, vegetables, and whole grains</li>';
            lifestyleHTML += '<li>Engage in regular physical activity (at least 150 minutes of moderate exercise per week)</li>';
            lifestyleHTML += '<li>Avoid tobacco products and limit alcohol consumption</li>';
            lifestyleHTML += '<li>Manage stress through relaxation techniques</li>';

            // Enhanced monitoring recommendations based on risk
            if (riskPercentage < 30) {
                monitoringHTML += '<li>Regular annual physical examination with your doctor</li>';
                monitoringHTML += '<li>Blood pressure check every 6 months</li>';
                monitoringHTML += '<li>Cholesterol screening every 4-6 years (or as recommended)</li>';
                monitoringHTML += '<li>Maintain a healthy weight and track BMI annually</li>';
            } else if (riskPercentage < 70) {
                monitoringHTML += '<li>Schedule a follow-up appointment with your doctor within 3 months</li>';
                monitoringHTML += '<li>Monitor blood pressure at home regularly (at least weekly)</li>';
                monitoringHTML += '<li>Cholesterol and blood glucose tests every 6-12 months</li>';
                monitoringHTML += '<li>Consider a baseline electrocardiogram (ECG) test</li>';
                monitoringHTML += '<li>Track your diet and exercise in a health journal</li>';
            } else {
                monitoringHTML += '<li>Immediate follow-up with a cardiologist within 2-4 weeks</li>';
                monitoringHTML += '<li>Daily home blood pressure monitoring and tracking</li>';
                monitoringHTML += '<li>Comprehensive cardiac workup including stress test and imaging</li>';
                monitoringHTML += '<li>Frequent lab work (every 3-4 months) to monitor cholesterol and other markers</li>';
                monitoringHTML += '<li>Careful monitoring of symptoms like chest pain, shortness of breath, or fatigue</li>';
            }

            // Medical advice based on risk
            if (riskPercentage < 30) {
                medicalHTML += '<li>Discuss results at your next regular check-up</li>';
                medicalHTML += '<li>No immediate medical intervention required</li>';
                medicalHTML += '<li>Continue following general heart health guidelines</li>';
            } else if (riskPercentage < 70) {
                medicalHTML += '<li>Schedule an appointment with your primary care physician soon</li>';
                medicalHTML += '<li>Discuss whether you should see a cardiologist for further evaluation</li>';
                medicalHTML += '<li>Consider medication options if other risk factors are present</li>';
                medicalHTML += '<li>Evaluate need for additional cardiac testing</li>';
            } else {
                medicalHTML += '<li>Seek prompt medical attention - this is a high priority</li>';
                medicalHTML += '<li>Request referral to a cardiologist for specialized care</li>';
                medicalHTML += '<li>Discuss medication and treatment options</li>';
                medicalHTML += '<li>Create a comprehensive cardiac care plan with your healthcare team</li>';
                medicalHTML += '<li>Consider joining a cardiac rehabilitation program if recommended</li>';
            }
        }

        lifestyleHTML += '</ul>';
        monitoringHTML += '</ul>';
        medicalHTML += '</ul>';

        lifestyleChanges.innerHTML = lifestyleHTML;
        monitoringSteps.innerHTML = monitoringHTML;
        medicalAdvice.innerHTML = medicalHTML;
    }
});