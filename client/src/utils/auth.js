import axios from "axios";
import { startRegistration } from "@simplewebauthn/browser";

let rawId;
let options;

export async function signup(params) {
  const email = params.email;

  // Get challenge from server
  try {
    const { data: initResponse } = await axios.get(
      `http://localhost:5000/init-registration?email=${email}`,
      { withCredentials: true }
    );
    options = await initResponse;
  } catch (error) {
    console.log(error);
  }

  // create pass key
  const registrationJson = await startRegistration(options);

  // save pass key in db
  try {
    const { data: verifyResponse } = await axios.post(
      "http://localhost:5000/verify-registration",
      registrationJson, // directly passing the object
      { withCredentials: true } // preserves cookies for cross-origin requests
    );
  } catch (error) {
    console.log(error);
    alert("Failed to register...");
  }
}

export async function login(params) {
  
}
