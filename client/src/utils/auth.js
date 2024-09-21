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

    // create pass key
    const registrationJson = await startRegistration(options);

    // save pass key in db

    const { data: verifyResponse } = await axios.post(
      "http://localhost:5000/verify-registration",
      registrationJson, // directly passing the object
      { withCredentials: true } // preserves cookies for cross-origin requests
    );

    console.log(verifyResponse);

    if (verifyResponse.verified) {
      alert("Registered Successfully...");
    } else {
      alert("Registration Failed");
    }
  } catch (error) {
    console.log(error);
    alert(error.response.data.msg);
  }
}

export async function login(params) {
  const email = params.email;
  try {
    // Get challenge from server
    const { data: initResponse } = await axios.get(
      `http://localhost:5000/init-auth?email=${email}`,
      { withCredentials: true }
    );
    const options = initResponse;

    // get pass key
    const authJson = await startAuthentication(options);

    // verify  pass key with db

    const { data: verifyResponse } = await axios.post(
      "http://localhost:5000/verify-auth",
      authJson, // directly passing the object
      { withCredentials: true } // preserves cookies for cross-origin requests
    );

    console.log(verifyResponse)
    alert("Logged in successfully...");
  } catch (error) {
    console.log(error);
    alert(error.response.data.msg);
  }
}
