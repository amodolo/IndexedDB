Ext.define('Demo.controller.Todo',{
	extend:'Ext.app.Controller',
    requires:['Demo.store.Todo'],

	config: {
        refs: {
        	field: 'main #todo',
        	addButton: 'main button[action=add]',
        	list: 'main #todoList',

            item: 'todoItem button[action=delete]'
        },	

		control: {
            addButton:{
            	tap: 'addTodo'
            },
            field:{
            	keyup: 'onFieldKeyup'
            },
            item:{
                deleteTodoItem:'deleteItem'
            }
        }
    },

    addTodo: function(){
    	var todo = this.getField().getValue()||"--empty--";
    	var store = Ext.getStore('todo');
    	store.add({text:todo});
    	store.sync();

    	this.getField().reset();
	    this.getField().element.dom.blur();
    },

    onFieldKeyup: function(sender, e, eOpts){
    	if (e.browserEvent.keyCode == 13 || e.browserEvent.keyCode == 10) {
		    e.stopEvent();
		    this.addTodo();
		}
    },

    deleteItem: function(record){
        var store = Ext.getStore('todo');
        store.remove(record);
        store.sync();

    }
});