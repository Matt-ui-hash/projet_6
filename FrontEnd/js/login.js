
// Définition idempotente des constantes globales (au cas où app.js n'est pas chargé)
window.API_BASE_URL = window.API_BASE_URL || "http://localhost:5678/api";
window.ENDPOINTS = window.ENDPOINTS || {
  LOGIN: window.API_BASE_URL + "/users/login",
  WORKS: window.API_BASE_URL + "/works",
  CATEGORIES: window.API_BASE_URL + "/categories"
};

const LOGIN_URL = window.ENDPOINTS.LOGIN;

document.getElementById("loginform").addEventListener("submit" , handleSubmit);

async function handleSubmit(event){
    event.preventDefault();
    
 const existingError = document.querySelector(".error-login");
  if (existingError) {
    existingError.remove();
  }
let user = {
     email : document.getElementById("email").value,
     password : document.getElementById("password").value,
 };

 let response = await fetch(LOGIN_URL,{
     method: "POST" ,
     headers: {
         "Content-Type": "application/json",
     },
     body: JSON.stringify(user),
 });
 if(response.status != 200){

    const errorBox =document.createElement("div");
    errorBox.className="error-login";
    errorBox.innerHTML="Il y a eu une erreur";
    document.querySelector("form").prepend(errorBox);

 }else{
 let result = await response.json();
 const token = result.token;
 sessionStorage.setItem("authToken", token);
 window.location.href = "index_edit.html";
 }
 }
