import { User } from "./UserManager";

export type Message =
	| {
			type: "JOIN_ROOM";
			payload: User;
	  }
	| {
			type: "CREATE_ROOM";
			payload: User;
	  };
