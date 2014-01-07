Ext.define('Demo.view.TodoItem', 
{
	extend: 'Ext.dataview.component.ListItem',
	xtype: 'todoItem',
	requires:[
		'Ext.Label'
	],

	config:{
		cls:'todo-item',

		layout:{
			type:'hbox',
			align:'center'
		},

		label: {
			flex:1
		},

		deleteButton:{
			action:'delete',
			ui:'decline',
			iconCls:'delete',
			handler:function(){
				this.fireEvent('deleteTodoItem',this.getParent().getRecord());
			}
		}
	},

	applyLabel: function(config){
		return Ext.factory(config, Ext.Label, this.getLabel());
	},

	updateLabel: function(newLabel, oldLabel){
		if(oldLabel){
			this.remove(oldLabel);
		}
		if(newLabel){
			this.add(newLabel);
		}
	},

	applyDeleteButton: function(config){
		return Ext.factory(config, Ext.Button, this.getDeleteButton());
	},

	updateDeleteButton: function(newButton, oldButton){
		if(newButton){
			this.add(newButton);
		}
		if(oldButton){
			this.remove(oldButton);
		}
	}
});