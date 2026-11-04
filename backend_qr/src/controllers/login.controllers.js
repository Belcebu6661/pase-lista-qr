//ESTE ES EL REPOSITORIO CLONADO 2026

export const login= (req, res)=>{
   
    try{
 return res.json({
    success: true,
    msg: "Login funcionando",
    data: {
        "username": "aldo",
        "email": "aldo@example.com",
        "id": 1
    }
});
}
catch(error){
 return res.json({
    success: false,
    msg: "Error en el login",
    data: error.message
});
}
}

