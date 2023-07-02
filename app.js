const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

const items = ["Buy Food", "Cook Food","Eat Food"];
const workItems = [];

app.set("view engine", "ejs");  

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
    name: String,

};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todoList!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

    Item.find({})
    .then(foundItem => {
      if (foundItem.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return foundItem;
      }
    })
    .then(savedItem => {
      res.render("list", {
        listTitle: "Today",
        newListItem: savedItem
      });
    })
    .catch(err => console.log(err));

});

app.get("/:customListName", function(req, res){
    const customListName = req.params.customListName;

    List.findOne({name: customListName})
    .then(function(foundList){
        if(!foundList){
            const list = new List({
            name: customListName,
            items: defaultItems
    });
        list.save();
        console.log("saved");
        res.redirect("/"+customListName);
        }
        else{
            res.render("list",{listTitle:foundList.name, newListItem:foundList.items});
        }
    })
    .catch(function(err){});
});

app.post("/", async (req, res) => {
    let itemName = req.body.newItem
    let listName = req.body.list
 
    const item = new Item({
        name: itemName,
    })
 
    if (listName === "Today") {
        item.save()
        res.redirect("/")
    } else {
 
        await List.findOne({ name: listName }).exec().then(foundList => {
            foundList.items.push(item)
            foundList.save()
            res.redirect("/" + listName)
        }).catch(err => {
            console.log(err);
        });
    }
})

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
 
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        res.redirect("/");
      })
      .catch(function () {
        console.log("delete error");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function (foundList) {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log("err in delete item from custom list");
      });
  }
});

app.get("/work", function(req, res) {
    res.render("list", {listTitle: "Work List", newListItem: workItems});
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
})