export interface Email {
  id: string;
  from: { name: string; email: string };
  to: { name: string; email: string };
  subject: string;
  preview: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  folder: string;
  labels?: string[];
  hasAttachment?: boolean;
}

const now = new Date();
const hours = (h: number) => new Date(now.getTime() - h * 3600000);
const days = (d: number) => new Date(now.getTime() - d * 86400000);

export const mockEmails: Email[] = [
  {
    id: "1",
    from: { name: "Sarah Chen", email: "sarah.chen@contoso.com" },
    to: { name: "You", email: "me@company.com" },
    subject: "Q4 Budget Review — Action Required",
    preview: "Hi team, please review the attached Q4 budget projections before our meeting on Friday. Key changes include...",
    body: `<p>Hi team,</p>
<p>Please review the attached Q4 budget projections before our meeting on Friday. Key changes include:</p>
<ul>
<li>Marketing spend increased by 12% to support the new product launch</li>
<li>Engineering headcount adjusted per the hiring plan</li>
<li>Travel budget reduced by 8% following the new remote-first policy</li>
</ul>
<p>I'd appreciate your feedback by Thursday EOD so we can finalize the numbers.</p>
<p>Best regards,<br/>Sarah Chen<br/>VP of Finance</p>`,
    date: hours(1),
    read: false,
    starred: true,
    folder: "inbox",
    labels: ["Important"],
    hasAttachment: true,
  },
  {
    id: "2",
    from: { name: "Microsoft Teams", email: "noreply@teams.microsoft.com" },
    to: { name: "You", email: "me@company.com" },
    subject: "You have a new message in Project Alpha",
    preview: "James Mitchell sent a message in the Project Alpha channel: 'The deployment pipeline is ready for review...'",
    body: `<p>James Mitchell sent a message in the <strong>Project Alpha</strong> channel:</p>
<blockquote>"The deployment pipeline is ready for review. I've set up the CI/CD workflow and all tests are passing. Can someone take a look at the PR?"</blockquote>
<p><a href="#">View in Teams</a></p>`,
    date: hours(2),
    read: false,
    starred: false,
    folder: "inbox",
  },
  {
    id: "3",
    from: { name: "David Park", email: "d.park@external.co" },
    to: { name: "You", email: "me@company.com" },
    subject: "Re: Partnership Proposal",
    preview: "Thanks for the detailed proposal. Our leadership team has reviewed it and we'd like to schedule a follow-up call...",
    body: `<p>Thanks for the detailed proposal. Our leadership team has reviewed it and we'd like to schedule a follow-up call to discuss the terms further.</p>
<p>Would next Tuesday at 2 PM EST work for your team? We'd like to include our CTO and Head of BD.</p>
<p>Looking forward to moving this forward.</p>
<p>Best,<br/>David Park<br/>Director of Partnerships, External Co.</p>`,
    date: hours(4),
    read: true,
    starred: true,
    folder: "inbox",
  },
  {
    id: "4",
    from: { name: "HR Department", email: "hr@company.com" },
    to: { name: "You", email: "me@company.com" },
    subject: "Updated PTO Policy — Effective Jan 1",
    preview: "Dear team, we're pleased to announce updates to our PTO policy. Starting January 1st, all full-time employees...",
    body: `<p>Dear team,</p>
<p>We're pleased to announce updates to our PTO policy. Starting January 1st, all full-time employees will receive:</p>
<ul>
<li>25 days of annual PTO (up from 20)</li>
<li>5 additional wellness days</li>
<li>Unlimited sick leave with manager approval</li>
</ul>
<p>Please review the full policy document on the HR portal.</p>
<p>Best,<br/>Human Resources</p>`,
    date: hours(6),
    read: true,
    starred: false,
    folder: "inbox",
  },
  {
    id: "5",
    from: { name: "Alex Rivera", email: "alex.r@company.com" },
    to: { name: "You", email: "me@company.com" },
    subject: "Design System v3 — Ready for Review",
    preview: "Hey! The design system update is finally ready. I've made significant changes to the component library including...",
    body: `<p>Hey!</p>
<p>The design system update is finally ready. I've made significant changes to the component library including:</p>
<ul>
<li>New color palette with improved accessibility scores</li>
<li>Updated spacing scale</li>
<li>12 new components</li>
<li>Dark mode support across all components</li>
</ul>
<p>Check it out in Figma and let me know your thoughts!</p>
<p>— Alex</p>`,
    date: days(1),
    read: false,
    starred: false,
    folder: "inbox",
    hasAttachment: true,
  },
  {
    id: "6",
    from: { name: "LinkedIn", email: "notifications@linkedin.com" },
    to: { name: "You", email: "me@company.com" },
    subject: "5 people viewed your profile this week",
    preview: "Your profile was viewed by people at Microsoft, Google, and other companies. See who's looking...",
    body: `<p>Your weekly profile update:</p><p>5 people viewed your profile this week, including professionals at Microsoft, Google, and Amazon.</p><p><a href="#">See all viewers</a></p>`,
    date: days(1),
    read: true,
    starred: false,
    folder: "inbox",
  },
  {
    id: "7",
    from: { name: "You", email: "me@company.com" },
    to: { name: "Marketing Team", email: "marketing@company.com" },
    subject: "Campaign Performance Report — November",
    preview: "Hi all, here are the November campaign metrics as discussed in our last sync...",
    body: `<p>Hi all,</p><p>Here are the November campaign metrics as discussed in our last sync. Overall performance exceeded targets by 15%.</p><p>Full report attached.</p>`,
    date: days(2),
    read: true,
    starred: false,
    folder: "sent",
  },
  {
    id: "8",
    from: { name: "You", email: "me@company.com" },
    to: { name: "Sarah Chen", email: "sarah.chen@contoso.com" },
    subject: "Re: Q3 Results Summary",
    preview: "Thanks Sarah, the numbers look great. I'll incorporate these into the board presentation...",
    body: `<p>Thanks Sarah, the numbers look great. I'll incorporate these into the board presentation and send a draft by Monday.</p><p>Best</p>`,
    date: days(3),
    read: true,
    starred: false,
    folder: "sent",
  },
  {
    id: "9",
    from: { name: "You", email: "me@company.com" },
    to: { name: "David Park", email: "d.park@external.co" },
    subject: "Draft: Partnership Proposal v2",
    preview: "Working on the updated terms based on our last discussion. Need to finalize the revenue share model...",
    body: `<p>Working on the updated terms based on our last discussion. Need to finalize the revenue share model before sending.</p>`,
    date: days(1),
    read: true,
    starred: false,
    folder: "drafts",
  },
];

export const folders = [
  { id: "inbox", name: "Inbox", count: 3 },
  { id: "starred", name: "Starred", count: 2 },
  { id: "sent", name: "Sent", count: 0 },
  { id: "drafts", name: "Drafts", count: 1 },
  { id: "archive", name: "Archive", count: 0 },
  { id: "spam", name: "Spam", count: 0 },
  { id: "trash", name: "Trash", count: 0 },
];
