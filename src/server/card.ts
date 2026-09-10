import "server-only"
import { createBus } from "./bus";
import { chaosRead, chaosWrite } from "./chaos";
import { getIdentity } from "./identity";

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

export type AddNewCardInput = Pick<Card, "text" | "column">

export async function addNewCard(card: AddNewCardInput) {
    const identity = await getIdentity();
    await chaosWrite('Adding Card');
    const prev = getCurrentCards()
    const lastCardId = prev[0] ? parseInt(prev[0].id) + 1 : 0;
    const currentTime = new Date().getDate();
    const newCard: Card = {
        ...card,
        id: `${lastCardId}`,
        authorId: identity.id,
        authorHue: identity.hue,
        authorName: identity.name,
        votes: [],
        createdAt: currentTime,
        updatedAt: currentTime
    }
    const next = [...prev, newCard].map(card => ({...card}))
    cardsBus.publish(next)

    return next
}

export type EditCardInput = Partial<Pick<Card, "text" | "column" | "votes">> & Pick<Card, "id">

export async function editCard(card:EditCardInput) {
    await chaosWrite('Editing Card')
    const prev = getCurrentCards()
    const next = [...prev].map(c => {
        if ( c.id === card.id) {
            return {
                ...c,
                ...card,
                updatedAt: new Date().getDate()
            }
        }
        return {...c}
    })
    cardsBus.publish(next)

    return next
}

export async function removeCard(id:string) {
    await chaosWrite('Removing Card')
    const prev = getCurrentCards()
    const next = [...prev].map(c => ({...c})).filter(c => c.id === id)
    cardsBus.publish(next)

    return next
}