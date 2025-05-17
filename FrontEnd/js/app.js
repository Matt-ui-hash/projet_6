async function getworks(filter){
    document.querySelector(".gallery").innerHTML="";
    const url ="http://localhost:5678/api/works";
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

async function getcategories(){
    const url ="http://localhost:5678/api/categories";
    try{
        const response =await fetch(url);
        if(!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);
        for(i=0;i<json.length;i++){
            setFilter(json[i])
        }
    } catch(error){
        console.error(error.message);
    }
}
getcategories()


function setFilter(data){
    console.log(data);
    const div = document.createElement("div");
    div.className =data.id;
    div.addEventListener("click", () => getworks(data.id));
    div.innerHTML = `${data.name}`
    document.querySelector(".container").append(div);
}
document.querySelector(".tous").addEventListener("click", () => getworks());