// Définition idempotente des constantes globales (sans dépendre d'autres fichiers)
window.API_BASE_URL = window.API_BASE_URL || "http://localhost:5678/api";
window.ENDPOINTS = window.ENDPOINTS || {
  LOGIN: window.API_BASE_URL + "/users/login",
  WORKS: window.API_BASE_URL + "/works",
  CATEGORIES: window.API_BASE_URL + "/categories"
};

// Constantes locales pour ce fichier (évite les duplications internes)
const WORKS_URL = window.ENDPOINTS.WORKS;
const CATEGORIES_URL = window.ENDPOINTS.CATEGORIES;

async function getworks(filter){
    document.querySelector(".gallery").innerHTML="";
    const url = WORKS_URL;
    try{
        const response =await fetch(url);
        if(!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        if(filter){
            const filtered= json.filter((data)=> data.categoryId===filter);
            for(let i =0; i<filtered.length;i++){
                setdata(filtered[i]);
              }
            }else{
                for(let i=0; i<json.length;i++){
                    setdata(json[i]);
                }
            }
    } catch(error){
        console.error(error.message);
    }
}
getworks()

function setdata(data){
const figure= document.createElement("figure");
figure.innerHTML=`<img src=${data.imageUrl} alt=${data.title}>
				<figcaption>${data.title}</figcaption>`;
document.querySelector(".gallery").append(figure);
}

// Ajout de la fonction setFilter pour générer les boutons de filtre dynamiquement
typeof window.filtersInitialized === 'undefined' && (window.filtersInitialized = false);
function setFilter(category) {
    let container = document.querySelector('.container');
    if (!container) {
        // Si le conteneur n'existe pas, on le crée
        container = document.createElement('div');
        container.className = 'container';
        // On l'insère avant la galerie
        const portfolioSection = document.querySelector('#portfolio');
        portfolioSection.insertBefore(container, portfolioSection.querySelector('.gallery'));
    }
    // Ne pas créer le bouton "Tous" dynamiquement, il est géré en HTML
    // Crée le bouton pour la catégorie
    const button = document.createElement('button');
    button.textContent = category.name;
    button.className = 'filter-btn';
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        getworks(category.id);
    });
    container.appendChild(button);
}

async function getcategories(){
    const url = CATEGORIES_URL;
    try{
        const response =await fetch(url);
        if(!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);
        // Ne pas générer les filtres en mode édition
        if (document.querySelector('.edition')) {
            return;
        }
        // Lier le bouton Tous statique si présent
        const allBtn = document.getElementById('filter-all');
        if (allBtn && !allBtn.dataset.bound) {
            allBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                allBtn.classList.add('active');
                getworks();
            });
            allBtn.dataset.bound = 'true';
        }
        for(let i=0;i<json.length;i++){
            setFilter(json[i])
        }
    } catch(error){
        console.log(error.message);
    }
}
getcategories()

const modifierDiv = document.querySelector('.modifier');
if (modifierDiv) {
  modifierDiv.addEventListener('click', function(e) {
    const modalLink = e.target.closest('.js-modal');
    if (modalLink) {
      e.preventDefault();
      openModal(modalLink);
    }
  });
}

let modal = null;
const focusableSelector = "button, a, input, textarea";
let focusables = [];

document.addEventListener("click", function(e) {
  const modalLink = e.target.closest('.js-modal');
  if (modalLink) {
    e.preventDefault();
    openModal(modalLink);
  }
});

// Ajoute cette fonction dans app.js
async function renderModalGallery() {
const url = WORKS_URL;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const works = await response.json();
    const modalGallery = document.querySelector('.modal-gallery');
    if (!modalGallery) return;
    modalGallery.innerHTML = '';
    works.forEach(work => {
      const figure = document.createElement('figure');
      figure.innerHTML = `
        <img src="${work.imageUrl}" alt="${work.title}">
        <button class="delete-btn" data-id="${work.id}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      modalGallery.appendChild(figure);
    });

    // Ajoute l'event listener pour la suppression
    modalGallery.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        // Appelle ici ta fonction de suppression
        await deleteworkById(id);
        // Rafraîchis la galerie après suppression
        renderModalGallery();
        getworks(); // Pour rafraîchir la galerie principale aussi
      });
    });
  } catch (error) {
    console.error(error.message);
  }
}

// Fonction de suppression
async function deleteworkById(id) {
  const deleteApi = WORKS_URL + "/";
  const token = sessionStorage.getItem("authToken");
  let response = await fetch(deleteApi + id, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  if (response.status == 401 || response.status == 500) {
    alert("Erreur lors de la suppression");
  }
}

const openModal = function(link) {
  console.log("openModal called", link);
  const modalId = link.getAttribute("href");
  modal = document.querySelector(modalId);
  if (!modal) return;

  // Toujours masquer la sous-modale d'ajout de photo à l'ouverture
  const addModal = modal.querySelector('.add-modal');
  if (addModal) {
    addModal.style.display = 'none';
  }
  // Toujours afficher la galerie photo (modal-wrapper)
  const galleryModal = modal.querySelector('.modal-wrapper');
  if (galleryModal) {
    galleryModal.style.display = 'block';
  }

  // Rafraîchir la galerie de la modale à chaque ouverture
  renderModalGallery();

  focusables = Array.from(modal.querySelectorAll(focusableSelector));
  modal.style.display = "flex";
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");

  modal.addEventListener('click', closeModal);
  modal.querySelectorAll('.js-modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  // Correction : appliquer stopPropagation sur tous les .js-modal-stop
  modal.querySelectorAll('.js-modal-stop').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
};

const closeModal = function(e) {
  if (modal === null) return;
  e.preventDefault();
  modal.style.display = "none";
  modal.setAttribute('aria-hidden', 'true');
  modal.removeAttribute('aria-modal');

  modal.removeEventListener('click', closeModal);
  modal.querySelectorAll('.js-modal-close').forEach(btn => {
    btn.removeEventListener('click', closeModal);
  });
  modal.querySelector('.js-modal-stop').removeEventListener('click', stopPropagation);

  modal = null;
};

const stopPropagation = function(e) {
  e.stopPropagation();
};


const focusInModal = function (e) {
    e.preventDefault();
    let index=focusables.findIndex((f) => f === modal.querySelector(":focus"));
    if(e.shiftKey === true){
        index--;
    }else{
        index++;
    }
    if(index >= focusables.length){
        index=0;
    }
    if(index < 0){
        index = focusables.length - 1;
    }
    focusables[index].focus();
};

window.addEventListener("keydown", function(e) {
  if (modal === null || e.key !== "Tab") return;

  // Si la sous-modale d'ajout de photo est visible, ne gérer le focus que dans celle-ci
  const addModal = modal.querySelector('.add-modal');
  if (addModal && addModal.style.display === 'block') {
    const addModalFocusables = Array.from(addModal.querySelectorAll('button, a, input, textarea'));
    if (addModalFocusables.length === 0) return;
    e.preventDefault();
    const focusedIndex = addModalFocusables.findIndex(f => f === document.activeElement);
    let nextIndex = focusedIndex;
    if (e.shiftKey) {
      nextIndex--;
    } else {
      nextIndex++;
    }
    if (nextIndex >= addModalFocusables.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = addModalFocusables.length - 1;
    addModalFocusables[nextIndex].focus();
    return;
  }

  // Sinon, gestion du focus dans la modale principale
  e.preventDefault();
  const focusedIndex = focusables.findIndex(f => f === document.activeElement);
  let nextIndex = focusedIndex;
  if (e.shiftKey) {
    nextIndex--;
  } else {
    nextIndex++;
  }
  if (nextIndex >= focusables.length) nextIndex = 0;
  if (nextIndex < 0) nextIndex = focusables.length - 1;
  focusables[nextIndex].focus();
});

// Gestion de l'affichage de la sous-modale d'ajout de photo

document.addEventListener('DOMContentLoaded', function() {
  const modalElement = document.getElementById('modal1');
  if (modalElement) {
    const addPhotoBtn = modalElement.querySelector('.add-photo-button');
    const addModal = modalElement.querySelector('.add-modal');
    const galleryModal = modalElement.querySelector('.modal-wrapper');
    if (addPhotoBtn && addModal && galleryModal) {
      addPhotoBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addModal.style.display = 'block';
        galleryModal.style.display = 'none';
      });
    }
    // Ajout du retour à la galerie photo via la flèche
    const backBtn = modalElement.querySelector('.modal-buttons-container .v');
    if (backBtn && addModal && galleryModal) {
      backBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addModal.style.display = 'none';
        galleryModal.style.display = 'block';
      });
    }
  }
});


// Delete function

async function deletework(event){
    const id =event.srcElement("div");
    const deleteApi ="http://localhost:5678/api/works/";
    const token =sessionStorage.authToken;
    let response= await fetch(deleteApi +id,{
        method:"DELETE",
        headers:{
            Authorization:"Bearer " + token,
        },
    });
    if(response.status == 401 || response.status == 500){
        const errorBox=document.createElement("div");
        errorBox.className="error-login";
        errorBox.innerHTML = "Il y a eu une erreur";
        document.querySelector(".modal-button-container").prepend(errorBox);
    }else{
        let result =await response.json();
        console.log(result);
    }
}

// Fonction pour charger les catégories dans le select
async function loadCategoriesForSelect() {
  const url = CATEGORIES_URL;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const categories = await response.json();
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error.message);
  }
}

// Fonction pour ajouter une nouvelle image
async function addNewWork(formData) {
  const addWorkApi = WORKS_URL;
  const token = sessionStorage.getItem("authToken");
  
  try {
    const response = await fetch(addWorkApi, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData
    });
    
    if (response.ok) {
      // Récupérer la nouvelle image ajoutée
      const newWork = await response.json();
      // Ajouter dynamiquement à la galerie principale
      setdata(newWork);
      // Ajouter dynamiquement à la galerie de la modale
      const modalGallery = document.querySelector('.modal-gallery');
      if (modalGallery) {
        const figure = document.createElement('figure');
        figure.innerHTML = `
          <img src="${newWork.imageUrl}" alt="${newWork.title}">
          <button class="delete-btn" data-id="${newWork.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
        modalGallery.appendChild(figure);
        // Ajouter l'event listener pour la suppression
        figure.querySelector('.delete-btn').addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = newWork.id;
          await deleteworkById(id);
          figure.remove();
        });
      }
      // Réinitialiser le formulaire
      document.getElementById('add-photo-form').reset();
      // Réinitialiser l'interface d'ajout d'image
      const fileSection = document.querySelector('.file-section');
      if (fileSection) {
        // Supprimer la prévisualisation et les boutons
        const imagePreview = fileSection.querySelector('.image-preview');
        const changeButton = fileSection.querySelector('.change-image-btn');
        if (imagePreview) imagePreview.remove();
        if (changeButton) changeButton.remove();
        // Recréer le bouton d'ajout
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-image-btn';
        addButton.innerHTML = '<i class="fa-solid fa-plus"></i> Ajouter photo';
        addButton.style.cssText = `
          background: #E8F1F6;
          border: 1px solid #0D2C36;
          border-radius: 50px;
          padding: 10px 20px;
          cursor: pointer;
          margin: 10px 0;
          font-size: 14px;
          color: #306685;
        `;
        addButton.addEventListener('click', function() {
          document.getElementById('file').click();
        });
        fileSection.appendChild(addButton);
      }
      // Afficher un message de succès
      alert("Image ajoutée avec succès !");
    } else {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'image:', error.message);
    alert("Erreur lors de l'ajout de l'image. Veuillez réessayer.");
  }
}

// Fonction pour prévisualiser l'image sélectionnée
function setupImagePreview() {
  const fileInput = document.getElementById('file');
  const fileSection = document.querySelector('.file-section');
  
  if (fileInput && fileSection) {
    // Créer un bouton d'ajout d'image personnalisé
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'add-image-btn';
    addButton.innerHTML = '<i class="fa-solid fa-plus"></i> Ajouter photo';
    addButton.style.cssText = `
      background: #E8F1F6;
      border: 1px solid #0D2C36;
      border-radius: 50px;
      padding: 10px 20px;
      cursor: pointer;
      margin: 10px 0;
      font-size: 14px;
      color: #306685;
    `;
    
    // Cacher l'input file original
    fileInput.style.display = 'none';
    
    // Ajouter le bouton personnalisé
    fileSection.appendChild(addButton);
    
    // Gérer le clic sur le bouton
    addButton.addEventListener('click', function() {
      fileInput.click();
    });
    
    // Gérer la sélection de fichier
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Vérifier la taille du fichier (4Mo max)
        if (file.size > 4 * 1024 * 1024) {
          alert("Le fichier est trop volumineux. Taille maximum : 4Mo");
          fileInput.value = '';
          return;
        }
        
        // Vérifier le type de fichier
        if (!file.type.match('image/(jpeg|jpg|png)')) {
          alert("Veuillez sélectionner une image au format JPG ou PNG");
          fileInput.value = '';
          return;
        }
        
        // Créer une prévisualisation
        const reader = new FileReader();
        reader.onload = function(e) {
          // Supprimer l'ancienne prévisualisation si elle existe
          const existingPreview = fileSection.querySelector('.image-preview');
          if (existingPreview) {
            existingPreview.remove();
          }
          
          // Supprimer le bouton d'ajout
          const existingButton = fileSection.querySelector('.add-image-btn');
          if (existingButton) {
            existingButton.remove();
          }
          
          // Supprimer l'ancien bouton "Changer l'image" s'il existe
          const oldChangeBtn = fileSection.querySelector('.change-image-btn');
          if (oldChangeBtn) oldChangeBtn.remove();
          
          // Créer la nouvelle prévisualisation
          const preview = document.createElement('img');
          preview.src = e.target.result;
          preview.className = 'image-preview';
          preview.style.cssText = `
            max-width: 100%;
            max-height: 200px;
            margin-top: 10px;
            border-radius: 8px;
            object-fit: cover;
          `;
          fileSection.appendChild(preview);
          
          // Ajouter un bouton pour changer l'image
          const changeButton = document.createElement('button');
          changeButton.type = 'button';
          changeButton.className = 'change-image-btn';
          changeButton.innerHTML = 'Changer l\'image';
          changeButton.style.cssText = `
            background: #E8F1F6;
            border: 1px solid #0D2C36;
            border-radius: 50px;
            padding: 8px 16px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 12px;
            color: #306685;
          `;
          fileSection.appendChild(changeButton);
          
          // Gérer le clic sur le bouton de changement
          changeButton.addEventListener('click', function() {
            fileInput.click();
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Modifier la fonction DOMContentLoaded pour inclure la prévisualisation
document.addEventListener('DOMContentLoaded', function() {
  const addPhotoForm = document.getElementById('add-photo-form');
  if (addPhotoForm) {
    // Activer/désactiver le bouton Valider selon l'état des champs
    const submitBtn = addPhotoForm.querySelector('input[type="submit"]');
    const updateSubmitButtonState = () => {
      const fileInput = document.getElementById('file');
      const titleInput = document.getElementById('title');
      const categoryInput = document.getElementById('category');
      const isValid = !!(fileInput && fileInput.files[0] && titleInput && titleInput.value.trim() && categoryInput && categoryInput.value);
      if (submitBtn) {
        submitBtn.disabled = !isValid;
        if (isValid) {
          submitBtn.classList.add('active');
        } else {
          submitBtn.classList.remove('active');
        }
      }
    };

    // Initial state
    updateSubmitButtonState();

    // Ecouteurs de changements
    const fileEl = document.getElementById('file');
    const titleEl = document.getElementById('title');
    const categoryEl = document.getElementById('category');
    if (fileEl) fileEl.addEventListener('change', updateSubmitButtonState);
    if (titleEl) titleEl.addEventListener('input', updateSubmitButtonState);
    if (categoryEl) categoryEl.addEventListener('change', updateSubmitButtonState);

    addPhotoForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const fileInput = document.getElementById('file');
      const titleInput = document.getElementById('title');
      const categoryInput = document.getElementById('category');
      
      // Validation des champs
      if (!fileInput.files[0]) {
        alert("Veuillez sélectionner une image");
        return;
      }
      
      if (!titleInput.value.trim()) {
        alert("Veuillez saisir un titre");
        return;
      }
      
      if (!categoryInput.value) {
        alert("Veuillez sélectionner une catégorie");
        return;
      }
      
      // Créer FormData pour l'envoi du fichier
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      formData.append('title', titleInput.value.trim());
      formData.append('category', categoryInput.value); // Correction ici
      
      // Appeler la fonction d'ajout
      await addNewWork(formData);

      // Mettre à jour l'état du bouton après réinitialisation du formulaire
      updateSubmitButtonState();
    });
  }
  
  // Charger les catégories au chargement de la page
  loadCategoriesForSelect();
  
  // Configurer la prévisualisation d'image
  setupImagePreview();
});
