export const URLS_BACKEND = {
	USERS: "/api/users/",
	USER: "/api/user/",
	USERME: "/api/user/me/", //profile GET

	LOGIN: "/api/login/",
	REFRESH: "/api/refresh/",
	VERIFY: "/api/verify/",
	SIGNUP: "/api/signup/",
	VERIFYTOTP: "/api/totp/verify-totp/",
	SIGNOUT: "/api/signout/",

	FORGOTPASSWORD: "/api/forgot-password/", //POST
	SETTINGS: "/api/settings/", //POST DELETE GET
	AVATAR: "/api/avatar/", //POST DELETE GET

	LOGIN42: "/api/oauth/42/login/",
	WS: "/api/ws/",

	TOURNAMENT_BLOCKCHAIN: "/api/tournament/score/" // GET with tournament UUID
};

export const ME_CONTEXT_REFRESH_DEFAULT = 0;

// export const ME_LOCALSTORAGE_KEY = "transcendence_me";

export const ME_CONTEXT_DEFAULT = {
	username: "",
	avatar: null,
	id: 0,
	email: "",
	agree_to_terms: false,
	is_login: false,
	elo: 1500,
	won_games: 0,
	lost_games: 0,
	friends: [],
	incoming_friends: [],
	blocked: [],
	game_mode: 0,
	in_lobby: [],
	incoming_one_v_one: [],
	incoming_tournament: [],
	leader: false,
	games: [],
	lock: false,
};

export const USERS_CONTEXT_DEFAULT = [];

export const DELAY_RESET_ALL_INVITE = 60000; // 1 minute

export const DELAY_REQUEST_REFRESH = 295000; // 4 minutes 55 seconds

export const GAME_SCREEN_WIDTH = 4.0;
export const GAME_SCREEN_HEIGHT = 3.0;

// export const BALL_RADIUS = 0.025; // ball size in backend is 0.05
export const BALL_RADIUS = 0.05;

export const GAME_ASPECT_RATIO = 4.0 / 3.0;

export const GAME_BACKEND_HZ_MS = (1.0 / 64.0) * 1000

export const GAME_TICK_DEFAULT = {
	key: "GAME_TICK",
	ball_position: [2, 1.5],
	paddle_left: 1.5,
	paddle_right: 1.5,
	points: [0, 0],
};

export const GAME_COUNTDOWN_DEFAULT = {
	key: "GAME_COUNTDOWN",
	value: -1,
	mode: 1,
};

export const CUSTOMIZATION_CONTEXT_DEFAULT = {
	paddle_color_left: 0xff8c00,
	paddle_color_right: 0xffd700,
	ball_color: 0x00bfff,
	board_color: 0x1f0c00,
	board_opacity: 1,
};

export const CUSTOMIZATION_CONTEXT_THEME_2 = {
	paddle_color_left: 0xffffff,
	paddle_color_right: 0xffffff,
	ball_color: 0xffffff,
	board_color: 0x000000,
	board_opacity: 1,
};

// OLD THEME BLUE TRANSPARENT
// export const CUSTOMIZATION_CONTEXT_DEFAULT = {
//     paddle_color_left: 0xffb966,
//     paddle_color_right: 0xffff87,
//     ball_color: 0xb366ff,
//     board_color: 0x00ffff,
//     board_opacity: 0.5,
// };

export function getStatusCodeMessage(statusCode) {
	switch (statusCode) {
		case 200:
			return "OK";
		case 201:
			return "Created";
		case 204:
			return "No Content";
		case 400:
			return "Bad Request";
		case 401:
			return "Unauthorized";
		case 403:
			return "Forbidden";
		case 404:
			return "Not Found";
		case 405:
			return "Method Not Allowed";
		case 408:
			return "Request Timeout";
		case 500:
			return "Internal Server Error";
		case 502:
			return "Bad Gateway";
		case 503:
			return "Service Unavailable";
		case 504:
			return "Gateway Timeout";
		default:
			return "Unknown Status Code";
	}
}

export function convertLocalhostToHttps(urlString) {
	const url = new URL(urlString);
	url.protocol = "https:";
	url.port = "8443";
	return url.toString();
}

export function formatDateInParis(dateString) {
	const date = new Date(dateString);

	return date.toLocaleString("en-US", {
		weekday: "short",
		year: "2-digit",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}
