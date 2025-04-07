export interface Email {
	email: {
		mail_from: string;
		rcpt_to: string[];
		data: string;
		id: string;
	};
	timestamp: string;
}
