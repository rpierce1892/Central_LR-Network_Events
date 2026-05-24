import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM ?? 'connect@ourchurch.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendNewMatchEmail(to: string, guestFirstName: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Someone new visited our church — they might be a great fit for your family`,
    html: `
      <p>Hi there,</p>
      <p>${guestFirstName} visited our church recently and our connection system thinks your family might have a lot in common.</p>
      <p>Their profile is available for a few days — take a look when you get a chance and decide if you'd like to reach out.</p>
      <p><a href="${APP_URL}/member/matches" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">View Profile</a></p>
      <p style="color:#666;font-size:13px;margin-top:24px"><em>This is a starting point — real relationships can't be captured on paper, but we hope this helps you find your people.</em></p>
      <p style="color:#666;font-size:12px">You're receiving this because you're enrolled in our guest connection program. You can pause participation anytime in your profile settings.</p>
    `,
  })
}

export async function sendMatchReminderEmail(to: string, guestFirstName: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${guestFirstName}'s profile is still waiting for a connection`,
    html: `
      <p>Hi there,</p>
      <p>Just a friendly reminder — ${guestFirstName} visited our church and is hoping to connect with a family like yours. Their profile expires soon.</p>
      <p><a href="${APP_URL}/member/matches" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">View Profile</a></p>
      <p style="color:#666;font-size:12px">No pressure — if it's not a fit, you can simply decline.</p>
    `,
  })
}

export async function sendLeaderAlertEmail(to: string, guestFirstName: string, guestId: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Action needed: ${guestFirstName} hasn't been connected yet`,
    html: `
      <p>Hi,</p>
      <p>${guestFirstName} submitted their connection profile but no member has accepted yet. As a small group leader, you may want to step in and personally reach out or manually assign a member.</p>
      <p><a href="${APP_URL}/leader/guests/${guestId}" style="background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">View Guest Profile</a></p>
    `,
  })
}

export async function sendMemberAcceptedEmail(
  to: string,
  memberFirstName: string,
  memberPhotoUrl: string | null,
  matchId: string
) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${memberFirstName} wants to connect with you!`,
    html: `
      <p>Great news! ${memberFirstName} from our church saw your profile and would love to connect.</p>
      ${memberPhotoUrl ? `<p><img src="${memberPhotoUrl}" alt="${memberFirstName}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;" /></p>` : ''}
      <p>Head over to the app to start chatting and plan to meet up at church!</p>
      <p><a href="${APP_URL}/guest/chat/${matchId}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">Open Chat</a></p>
    `,
  })
}

export async function sendPreServiceAlertEmail(
  to: string,
  guestFirstName: string,
  serviceDay: string
) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${guestFirstName} will be at church ${serviceDay} — look for them!`,
    html: `
      <p>Hi!</p>
      <p>Just a heads up — ${guestFirstName}, the guest you connected with, will likely be at church ${serviceDay}. This is your chance to introduce your families in person.</p>
      <p>Use the in-app chat to coordinate where you'll be sitting or where to meet up.</p>
      <p><a href="${APP_URL}/member/matches" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">Open Chat</a></p>
    `,
  })
}

export async function sendGuestConnectedEmail(to: string, churchName: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `You're all set — someone from ${churchName} is excited to meet you!`,
    html: `
      <p>Welcome!</p>
      <p>Someone from our church has accepted your connection request and is looking forward to meeting you. Check the app to see their photo and start chatting — you can use it to find each other at church!</p>
      <p><a href="${APP_URL}/guest/pending" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">View Connection</a></p>
    `,
  })
}
