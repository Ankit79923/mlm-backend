var nodemailer = require('nodemailer');

var sendMail = async function (str, data, token) {
    console.log('2. Inside sendMail function');
    

    // --------------------------- connection with SMTP server
   const transporter = nodemailer.createTransport({
           host: 'smtp.gmail.com',
           port: 465,
           secure: true,
           auth: {
               user: 'myudbhabmarketing@gmail.com',
               pass: 'bwrm kwvn eiwq dehl',
           },
           logger: true, // Enable logging
           debug: true,  // Enable debug messages
       });
    console.log('3. Inside sendMail function');
    
    // --------------------------- create email details
    console.log('4. Inside sendmail fxn');
    let recipientEmail = data.email;
    let subject, html;

    
   
    
    
    if (str == 'forgotPassword') {
        subject = `Password Reset E-mail`;
        html = `<h3>You are receiving this email because you or someone else has requested a password reset for your account at <strong>Utbhab Marketing Private Limited</strong>.</h3>

<p>To reset your password, please click the link below:</p>
<p><a href="https://myudbhab.in/verify-email?token=${token}" target="_blank">Click here to reset your password</a></p>

<p>If you did not request a password reset, you can safely ignore this email.</p>`
    }
    
    console.log(str);
    console.log("5. ");
    console.log(recipientEmail); 
    console.log("6. ");
    console.log(subject);
    console.log("7. ");
    console.log(html);
    

    // --------------------------- mailOptions
    var mailOptions = {
        from: 'myudbhabmarketing@gmail.com',
        to: recipientEmail,
        subject: subject,
        html: html
    };

    console.log('8.');
    console.log(mailOptions);
    

    // --------------------------- send email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return 'sent';
    } catch (error) {
        console.log(error);
        console.log(error.message);
        
        return 'error';
    }
}


module.exports = sendMail;


