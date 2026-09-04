import "server-only"
import { createBus } from "./bus";
import { chaosRead, chaosWrite } from "./chaos";

export type Column = 'went-well' | 'didnt-go-well' | 'action-items';

export interface Card {
  id: string;
  column: Column;
  text: string;
  authorId: string;     // from getMe()
  authorName: string;
  authorHue: number;
  votes: string[];      // authorIds; one vote per person, toggleable
  createdAt: number;
  updatedAt: number;
}

const cardsBus = createBus<Card[]>([])

export function getCurrentCards() {
    return cardsBus.current()
}

export function subscribeToCards(signal?:AbortSignal) {
    return cardsBus.subscribe(signal)
}

export async function readCards() {
    await chaosRead()
    return getCurrentCards()
}

export async function addNewCard(card:Card) {
    await chaosWrite('Adding Card')
    const prev = getCurrentCards()
    const next = [...prev, card].map(card => ({...card}))
    cardsBus.publish(next)

    return next
}

export async function editCard(card:Card) {
    await chaosWrite('Editing Card')
    const prev = getCurrentCards()
    const next = [...prev].map(c => {
        if ( c.id === card.id) {
            return card
        }
        return {...c}
    })
    cardsBus.publish(next)

    return card
}

export async function removeCard(id:string) {
    await chaosWrite('Removing Card')
    const prev = getCurrentCards()
    const next = [...prev].map(c => ({...c})).filter(c => c.id === id)
    cardsBus.publish(next)

    return next
}