init();

function init(){
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
      case "GETDATA": return HandleGetData(request, sender, sendResponse);
      case "SETDATA": return HandleSetData(request, sender, sendResponse);
      case "SHOWOVERLAY": return HandleShowOverlay(request, sender, sendResponse);
    }
  });
  
  var inputs = document.querySelectorAll(".priceInput");
  inputs.forEach(input => {
    input.addEventListener("blur", (e) => validateInput(e.target));
    validateInput(input)
  });
}

function validateInput(input) {
  var price = input.value ? parseFloat(input.value) : 0;
  if (price <= 0) {
    input.style.outline = 'solid 2px red'
    input.value = '0.00'
  } else {
    input.style.outline = ''
  }
}

function HandleGetData(request, sender, sendResponse) {  
  var ingredients = JSON.parse(window.localStorage.ingredients);
  var supermap = GetSupermap();
  sendResponse({ ingredients: ingredients, supermap: supermap });
}

function HandleSetData(request, sender, sendResponse) {  
  if (request.ingredients && request.ingredients.length > 0) {
    localStorage.ingredients = JSON.stringify(request.ingredients)
    localStorage.laborCost = "0.3"
    localStorage.profitPercent = "50"
    localStorage.resourceCostMultiplier = "0.5"
    location.reload();
    sendResponse({ success: true });

  }

  sendResponse({ success: false });
}

function HandleShowOverlay(){
  document.body.style.filter = 'blur(20px)';
  document.body.style.overflow = "hidden";
}

function GetSupermap() {
  const ingredientRows = document.getElementsByClassName("ingredientRow");
  const supermap = Array.from(ingredientRows).reduce((map, obj) => {
    const label = obj.querySelector('label');
    if (label) {
      const labelFor = label.getAttribute('for').replace('-priceInput', '');
      const labelText = label.innerText.trim();
      map[labelText] = labelFor;
      map[labelFor] = labelText;
    }
    return map;
  }, {});

  return supermap
}