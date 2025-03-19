import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GeneralProvider } from "./context/GeneralProvider.jsx";
import { Router } from "./Router.jsx";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Infinity,
			cacheTime: Infinity,
		},
	},
});

export default function App() {
	return (
		<div className="app-background">
			<QueryClientProvider client={queryClient}>
				<GeneralProvider>
					<Router />
					{/* <ReactQueryDevtools initialIsOpen={false} /> */}
				</GeneralProvider>
			</QueryClientProvider>
		</div>
	);
}
