import type { Category, Nominee } from './admin-types'

type Credit = { name: string; url?: string }
export type InvitationPerson = { nominee: Nominee; categories: string[]; profileUrl?: string }

function identity(name: string) {
  return name.trim().toLowerCase().replace(/^@/, '').replace(/[\s_-]/g, '')
}

function handle(url?: string) {
  try { return new URL(url!).pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '') || '' }
  catch { return '' }
}

export function invitationPeople(categories: Category[]): InvitationPerson[] {
  const people = new Map<string, InvitationPerson>()
  const aliases = new Map<string, string>()
  const projects = /^(SERIE|EVENTO|CLIP)$/i
  function addCategory(person: InvitationPerson, category: string) {
    if (!person.categories.includes(category)) person.categories.push(category)
  }
  for (const category of categories.filter(item => !projects.test(item.name))) {
    for (const nominee of category.nominees) {
      const key = identity(nominee.display_name)
      const person = people.get(key) || { nominee, categories: [] }
      addCategory(person, category.id)
      people.set(key, person)
      aliases.set(key, key)
      const login = handle(nominee.ext?.channel_url)
      if (login) aliases.set(identity(login), key)
    }
  }
  for (const category of categories.filter(item => projects.test(item.name))) {
    for (const nominee of category.nominees) {
      let credits: Credit[] = nominee.ext?.credits || []
      if (nominee.display_name === 'Chapamon' || nominee.display_name === 'KevOlimpiadas Valorant 3') {
        credits = [{ name: 'ElNaiti_', url: 'https://www.twitch.tv/elnaiti_' }]
      }
      if (nominee.display_name === 'UHC by AnnCovers') {
        credits = [{ name: 'anncoveers', url: 'https://www.twitch.tv/anncoveers' }]
      }
      for (const credit of credits) {
        const login = handle(credit.url)
        const key = aliases.get(identity(login)) || aliases.get(identity(credit.name)) || identity(login || credit.name)
        let person = people.get(key)
        if (!person) {
          person = {
            nominee: { id: `author-${key}`, display_name: login || credit.name, avatar_url: null, ext: null },
            categories: [],
            profileUrl: credit.url,
          }
          people.set(key, person)
        }
        addCategory(person, category.id)
      }
    }
  }
  return [...people.values()].sort((a, b) => a.nominee.display_name.localeCompare(b.nominee.display_name))
}
