Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
	// This code only runs on the server
	Meteor.publish("tasks", function () {
		return Tasks.find({
			$or: [
			{private: {$ne: true} },
			{owner: this.userId }
			]
		});
	});
}

if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("tasks");

  Template.body.helpers({
    tasks: function () {
      if (Session.get("hideCompleted")) {
      	// If hide completed is chekced, filter tasks
      	return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
      	//otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
    	return Session.get("hideCompleted");
    },
    incompleteCount: function () {
    	return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
  	"submit .new-task": function (event) {

  		//prevent defualt browser form submit 
  		event.preventDefault();

  		//get value from the form element 
  		var text = event.target.text.value;

  		//insert a task into the collection
  		Meteor.call("addTask", text);

  		//clear form 
  		event.target.text.value = "";
  	}, 
  	"change .hide-completed": function (event) {
  	 	Session.set("hideCompleted", event.target.checked);
  	}
  });

  Template.task.helpers({
  	isOwner: function () {
  		return this.owner === Meteor.userId();
  	}
  });

  Template.task.events({
  	"click .toggle-checked": function () {
  		// Set the check property to the opposite of its current value
  	Meteor.call("setChecked", this._id, ! this.checked);
  	},
  	"click .delete": function () {
  		Meteor.call("deleteTask", this._id);
  	},
  	"click .delete": function () {
  		Meteor.call("deleteTask", this._id);
  	},
  	"click .toggle-private": function () {
  		Meteor.call("setPrivate", this._id, ! this.private);
  	}
  });

  Accounts.ui.config({
  	passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
	addTask: function (text) {
		// Make sure the user is logged in before inserting a task
		if (! Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		Tasks.insert({
			text: text,
			createdAt: new Date(),
			owner: Meteor.userId(),
			username:Meteor.user().username
		});
	},
	deleteTask: function (taskId) {
		var task = Tasks.findOne(taskId);
		if (task.private && task.owner !== Meteor.userId()) {
			// If the task is private, make sure only the owner can delete it
			throw new Meteor.Error("not-authorized");
		}
		Tasks.remove(taskID);
	},
	setChecked: function (taskId, setChecked) {
		var task = Tasks.findOne(taskId);
		if (task.private && task.owner !== Meteor.userId()) {
			// If the task is private, make sure only the owner can check if off
			throw new Meteor.Error("not-authorized");
		}
		
		Tasks.update(taskId, {$set: {checked: setChecked} });
	},
	setPrivate: function (taskId, setToPrivate) {
		var task = Tasks.findOne(taskId);

		// Make sure only the task owner can make a task private
		if (task.owner !== Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		Tasks.update(taskId, { $set: { private: setToPrivate } });
	},

});