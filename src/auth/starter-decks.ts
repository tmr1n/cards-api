// Готовые стартовые колоды — подсеваются новому/демо-пользователю,
// чтобы «ready-made decks» с лендинга не были пустым обещанием.
export const STARTER_DECKS = [
	{
		title: 'Deutsch im Alltag',
		cards: [
			{ front: 'das Haus', back: 'house' },
			{ front: 'das Wasser', back: 'water' },
			{ front: 'der Freund', back: 'friend' },
			{ front: 'arbeiten', back: 'to work' },
			{ front: 'kaufen', back: 'to buy' },
			{ front: 'heute', back: 'today' },
			{ front: 'die Straße', back: 'street' },
			{ front: 'danke', back: 'thank you' }
		]
	},
	{
		title: 'IT-Grundbegriffe',
		cards: [
			{ front: 'API', back: 'Interface for programs to talk to each other' },
			{ front: 'Bug', back: 'An error in the code' },
			{ front: 'Frontend', back: 'The part of an app the user sees' },
			{ front: 'Backend', back: 'Server-side logic and data handling' },
			{ front: 'Datenbank', back: 'System for storing structured data' },
			{ front: 'Deploy', back: 'To put an application live' }
		]
	},
	{
		title: 'Spanisch Basics',
		cards: [
			{ front: 'hola', back: 'hello' },
			{ front: 'gracias', back: 'thank you' },
			{ front: 'agua', back: 'water' },
			{ front: 'amigo', back: 'friend' },
			{ front: 'casa', back: 'house' },
			{ front: 'comer', back: 'to eat' }
		]
	}
]
