const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'juan.saler89@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'juan.saler89@gmail.com',
        subject: 'Cancelation confirmed',
        text: `It's a shame that you leave, ${name}. Please, let us know the reasons why you cancel your account.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}