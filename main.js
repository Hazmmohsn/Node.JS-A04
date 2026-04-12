const fs = require("fs");
const expres = require('express');
const { escape } = require("querystring");
const app = expres();
const port = 3000;
app.use(expres.json());


function ParseUsersData (req,res,next){

    const users = fs.readFile("./users.json", "utf-8" ,(err,data)=>{

        if(err){
            req.users = [];
            return next();
        }
        if (!data || data.trim() === "") {
            req.users = [];
            return next();
        }

        req.users = JSON.parse(data);
        return next();
    });
}

function WriteUsersData(req,res,next){

    if(!req.users) return next();
    const data = JSON.stringify(req.users, null, 2);
    fs.writeFile("./users.json", data ,"utf-8", (err)=>{

        if(err) return next(err);

        return next();

    });
}


app.post("/user", ParseUsersData,(req,res,next)=>{

    const user = req.body;

    const exists = req.users.find((u)=>{

        return u.email === user.email;
    })
    if(exists) return res.status(400).json({ message : "Email Already Exists"});
    req.users.push({
        id : Date.now(),
        ...user
    });
    next();

},WriteUsersData,(req,res)=>{

    res.status(201).json({ message : "User Added Successfully"});
});

app.patch("/user/:id",ParseUsersData,(req,res,next)=>{

    const {id} = req.params;

    const userToUpdate = req.body;

    const users = req.users;

    let existsId = users.findIndex((u)=>{
        return u.id === Number(id);
    })

    if(existsId === -1) res.status(400).json({message : "User ID not found"})
    
    users[existsId] = {...users[existsId],...userToUpdate};
    
    req.users = users;
    next();

},WriteUsersData,(req,res)=>{
    res.status(200).json({message : "User data update successfully"})
})

app.delete("{/user/:id}",ParseUsersData,(req,res,next)=>{

    const users = req.users;

    if(req.params.id){

        const exists = users.findIndex((u)=>{return  u.id === Number(req.params.id)})

        if(exists === -1) return res.status(404).json({message : "User not found"});

        const usersData = users.filter((u)=>{return  u.id !== Number(req.params.id)});

        req.users = usersData;

        next();
    }
    else if(req.body.id){

        const exists = users.findIndex((u)=>{return  u.id === Number(req.body.id)})

        if(exists === -1) return res.status(404).json({message : "User not found"});

        const usersData = users.filter((u)=>{return  u.id !== Number(req.body.id)});

        req.users = usersData;

        next();

    }
    else{

        return res.status(404).json({message : "User not found"})
    }


},WriteUsersData,(req,res)=>{
    res.status(200).json({message : "User deleted successfully"})
});

app.get("/user/GetByName",ParseUsersData,(req,res,next)=>{

    const {name} = req.query;
   
    const users = req.users;

    if(!name) res.status(404).json({message : "Query parameter not matched"});

    const exists = users.find((u)=>{
        return u.name === name;
    })

    if(!exists) res.status(404).json({message : "User not found"});
    
    res.status(200).json(exists);

});

app.get("/user",ParseUsersData,(req,res,next)=>{

    const users = req.users;
    
    res.status(200).json(users);

});

app.get("/user/filter",ParseUsersData,(req,res,next)=>{

    const {minAge} = req.query;
   
    const users = req.users;

    if(!minAge) return res.status(404).json({message : "Query parameter not matched"});

    const exists = users.filter((u)=>{
        return u.age >= minAge;
    })

    if(exists.length === 0) return res.status(404).json({message : "User not found"});

    res.status(200).json(exists);

});

app.get("/user/:id",ParseUsersData,(req,res,next)=>{

    const {id} = req.params;
   
    const users = req.users;

    const exists = users.find((u)=>{
        return u.id ===  Number(id);
    })

    if(!exists) return res.status(404).json({message : "User not found"});

    res.status(200).json(exists);

});

app.all("/*dummy", (req,res)=>{

    res.status(404).json({ message : "Not Found"});

});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});