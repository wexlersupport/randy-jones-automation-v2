import sgMail from '@sendgrid/mail'
import { convertHtmlEmail } from '~/utils'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    
    try {
        // Set SendGrid API key with proper type checking
        const apiKey = config.sendgridApiKey || process.env.SENDGRID_API_KEY
        if (!apiKey || typeof apiKey !== 'string') {
            throw createError({
                statusCode: 500,
                statusMessage: 'SendGrid API key is not configured'
            })
        }
        sgMail.setApiKey(apiKey as string)
        
        const { from, to, subject, html, attachments } = parseBody.emailObj
        
        // Prepare email content with improved HTML formatting
        const emailContent: any = {
            from: from || 'noreply@yourcompany.com',
            to: to,
            subject: subject,
            html: convertHtmlEmail(html)
        }
        
        // Add attachments if they exist
        if (attachments && attachments.length > 0) {
            emailContent.attachments = attachments.map((attachment: any) => ({
                content: attachment.content,
                filename: attachment.filename,
                type: attachment.type || 'application/pdf',
                disposition: 'attachment'
            }))
        }
        
        // Send email using SendGrid
        const response = await sgMail.send(emailContent)
        
        return {
            success: true,
            data: response[0],
            accepted: [to],
            messageId: response[0].headers['x-message-id']
        }
        
    } catch (error: any) {
        console.error('SendGrid API Error:', error.response?.body || error.message)
        
        // Return error in a format that matches the expected response structure
        return {
            success: false,
            error: error.response?.body || error.message,
            statusCode: error.code || 500
        }
    }
})