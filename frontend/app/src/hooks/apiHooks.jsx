//(08. Fetching Data 01:55) (14. Fetching on Demand)
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { URLS_BACKEND } from "../constants.jsx";

// https://docs.djangoproject.com/en/5.1/howto/csrf/
function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== "") {
		const cookies = document.cookie.split(";");
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === name + "=") {
				cookieValue = decodeURIComponent(
					cookie.substring(name.length + 1)
				);
				break;
			}
		}
	}
	return cookieValue;
}

// fetch react-query for signup and login "19. Dependent Queries 00:51"
// no try catch and await for response.json() see (08.Fetching Data 01:55)
// this function do a fetch with default header
async function customFetch(url, method = "GET", body = null) {
	const csrftoken = getCookie("csrftoken");

	console.log("customFetch called for " + url + " csrftoken: " + csrftoken);

	const headers = {
		Accept: "application/json",
		"Content-Type": "application/json",
		"X-CSRFToken": csrftoken,
	};

	const options = {
		method,
		headers,
		credentials: "include",
	};

	if (body !== null) {
		options.body = JSON.stringify(body);
	}

	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	// return response.json();
	const text = await response.text();
	return text ? JSON.parse(text) : null;
}

export function useQueryUserMe() {
	return useQuery({
		queryKey: ["me"],
		queryFn: () => customFetch(URLS_BACKEND.USERME),
	});
}

// to see https://tkdodo.eu/blog/mastering-mutations-in-react-query
// no try catch and await for response.json() see (08.Fetching Data 01:55)
// this function do a fetch + query with default header
export function useMutationCustom(
	url,
	method = "POST",
	data = null,
	onSuccess = () => {},
	onError = () => {},
	mode_content_accept = 1
) {
	const mutationOptions = {
		mutationFn: async () => {
			const csrftoken = getCookie("csrftoken");

			console.log(
				"useMutationCustom called for " +
					url +
					" csrftoken: " +
					csrftoken
			);

			const fetchOptions = {
				method: method,
				credentials: "include",
			};

			if (mode_content_accept === 1) {
				fetchOptions.headers = {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-CSRFToken": csrftoken,
				};
			} else {
				fetchOptions.headers = {
					"X-CSRFToken": csrftoken,
				};
			}

			if (data !== null && mode_content_accept === 1) {
				fetchOptions.body = JSON.stringify(data);
			} else if (data !== null) {
				console.log("passhere", url, data);
				fetchOptions.body = data;
			}

			const response = await fetch(url, fetchOptions);

			if (!response.ok) {
				throw response.status;
			}

			// return response.json();
			const text = await response.text();
			return text ? JSON.parse(text) : null;
		},
		onSuccess,
		onError,
	};

	return useMutation(mutationOptions);
}

export function useMutationDownloadCSV(
	onSuccess = () => {},
	onError = () => {}
) {
	const mutationOptions = {
		mutationFn: async () => {
			const csrftoken = getCookie("csrftoken");

			console.log(
				"useMutationCustom called for " +
					URLS_BACKEND.SETTINGS +
					" csrftoken: " +
					csrftoken
			);

			const fetchOptions = {
				method: "GET",
				credentials: "include",
				headers: {
					Accept: "text/csv",
					"Content-Type": "text/csv",
					"X-CSRFToken": csrftoken,
				},
			};

			const response = await fetch(URLS_BACKEND.SETTINGS, fetchOptions);

			if (!response.ok) {
				throw response.status;
			}

			const blob = await response.blob();

			const downloadUrl = window.URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = "user_data.csv";
			document.body.appendChild(link);
			link.click();

			link.remove();
			window.URL.revokeObjectURL(downloadUrl);

			return null;
		},
		onSuccess,
		onError,
	};

	return useMutation(mutationOptions);
}

// no try catch and await for response.json() see (08.Fetching Data 01:55)
// this function combine two fetch + query
export function useMutationCustomSignupLogin(
	username,
	password,
	email,
	agree_to_terms,
	onSuccess = () => {},
	onError = () => {}
) {
	return useMutation({
		mutationFn: async () => {
			const bodySignup = {
				username: username,
				password: password,
				email: email,
				agree_to_terms: agree_to_terms,
			};
			const bodyLogin = {
				username: username,
				password: password,
			};
			const signup = await customFetch(
				URLS_BACKEND.SIGNUP,
				"POST",
				bodySignup
			);
			const login = await customFetch(
				URLS_BACKEND.LOGIN,
				"POST",
				bodyLogin
			);
			return { signup, login };
		},
		onSuccess,
		onError,
	});
}
export function useMutationCustomUserMeUsers(
	onSuccess = () => {},
	onError = () => {}
) {
	const mutationOptions = {
		mutationFn: async () => {
			const userMe = await customFetch(URLS_BACKEND.USERME, "GET");
			const users = await customFetch(URLS_BACKEND.USERS, "GET");
			return { userMe, users };
		},
		onSuccess,
		onError,
	};

	return useMutation(mutationOptions);
}

export function useMutationUser(onSuccess = () => {}, onError = () => {}) {
	return useMutation({
		mutationFn: async (id) => {
			const url = `${URLS_BACKEND.USER}${id}`;

			const csrftoken = getCookie("csrftoken");

			console.log(
				"useMutationUser called for " + url + " csrftoken: " + csrftoken
			);

			const fetchOptions = {
				method: "GET",
				headers: {
					Accept: "application/json",
					"X-CSRFToken": csrftoken,
				},
				credentials: "include",
			};

			const response = await fetch(url, fetchOptions);

			if (!response.ok) {
				throw new Error(response.status);
			}

			const text = await response.text();
			return text ? JSON.parse(text) : null;
			// return response.json();
		},
		onSuccess,
		onError,
	});
}
