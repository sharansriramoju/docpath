import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import store from "./store";
import router from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </Provider>,
);
