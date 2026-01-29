export type Chat = {
	id: string;
	text?: string;
	file?: {
		url: string;
		type: string;
		name: string;
	};
	me: boolean;
	sender?: string;
	replyTo?: {
		id: string;
		text?: string;
		file?: {
			url: string;
			type: string;
			name: string;
		};
	};
};

export type Role = "ADMIN" | "USER";

export type Status = "loading" | "joined" | "invalid";
