import axios from "axios";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

export async function signup(params) {
  const email = params.email;
  let options;

  // Get challenge from server
  try {
    const { data: initResponse } = await axios.get(
      `http://localhost:5000/init-registration?email=${email}`,
      { withCredentials: true }
    );
    options = initResponse;
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

    alert("Registered Successfully...");
  } catch (error) {
    console.log(error);
    alert("Failed to register...");
  }
}

export async function login(params) {
  const email = params.email;

  // Get challenge from server
    const { data: initResponse } = await axios.get(
      `http://localhost:5000/init-auth?email=${email}`,
      { withCredentials: true }
    );
    const options =  initResponse;

  // get pass key
  const authJson = await startAuthentication(options);

  // verify  pass key with db
  try {
    const { data: verifyResponse } = await axios.post(
      "http://localhost:5000/verify-auth",
      authJson, // directly passing the object
      { withCredentials: true } // preserves cookies for cross-origin requests
    );

    alert("Logged in successfully...");
  } catch (error) {
    console.log(error);
    alert("Failed to login...");
  }
}
