Ext.define('Lib.data.proxy.IndexedDB',{
    alias:'proxy.indexeddb',
    extend:'Ext.data.proxy.Client',
    alternateClassName: 'Lib.IndexedDB',

    db:null,

    config:{
        /**
         * @cfg {Object} reader
         * @hide
         */
        reader: null,
        /**
         * @cfg {Object} writer
         * @hide
         */
        writer: null,
        /**
         * @cfg {String} table
         * Optional Table name to use if not provided ModelName will be used
         */
        table: null,
        /**
         * @cfg {String} database
         * Database name to access tables from
         */
        database: 'Sencha',

        defaultDateFormat: 'Y-m-d H:i:s.u'
    },

    statics:{
        /*
         * hash containing the table name and the associated model.
         * this is used during the db upgrade in order to create the table for all models that use this proxy
         */
        registry:[]
    },

    constructor: function(config){
        this.callParent(arguments);
        this.initConfig(config);

        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    },

    destroy: function() {
        this.db.close();
        this.callParent(arguments);
    },

    updateModel: function(model) {
        if (model) {
            var modelName = model.modelName,
                defaultDateFormat = this.getDefaultDateFormat(),
                table = modelName.slice(modelName.lastIndexOf('.') + 1);

            model.getFields().each(function (field) {
                if (field.getType().type === 'date' && !field.getDateFormat()) 
                    field.setDateFormat(defaultDateFormat);
            });

            if (!this.getTable())
                this.setTable(table);

            //register the model instance to the registry
            var registry = this.self.registry;
            registry[model.getProxy().getTable()]=model;
        }

        this.callParent(arguments);
    },

    /**
     * Open a database connection and invoke the relative callback when has done (whether successful or not).
     * @param {Function} callback Callback function to be called when the database has been successfully opened
     * @param {Function} fail Callback function to be called when the database open has been failed
     * @method
     */
    open: function(success, fail){
        var me = this;

        var request = window.indexedDB.open(me.getDatabase(), 1);
        request.onerror = function(event){
            if(typeof fail==='function')
                fail.call(me, event.target.error);
        };

        request.onsuccess = function(event){
            if(typeof success==='function')
                success.call(me,event.target.result);
        };
        request.onupgradeneeded = function(event){
            var db = event.target.result,
                registry = me.self.registry;

            for(var table in registry){
                if(!db.objectStoreNames.contains(table)){
                    var key = registry[table].getIdProperty()||'id';
                    db.createObjectStore(table, { keyPath:key });
                }
            }
        };
    },

    /**
     * Performs the given create operation. 
     * @param {Ext.data.Operation} operation The Operation to perform
     * @param {Function} callback Callback function to be called when the Operation has completed (whether successful or not)
     * @param {Object} scope Scope to execute the callback function in
     * @method
     */
    create: function(operation, callback, scope){
        var me=this,
            records = operation.getRecords();

        function openSuccess(db){
            operation.setStarted();

            var transaction=db.transaction(me.getTable(),'readwrite');
            transaction.oncomplete = function(event){
                operation.setSuccessful();
                operation.setCompleted();

                if (typeof callback == 'function')
                    callback.call(scope, operation);
            };
            transaction.onerror = function(event){
                operation.setException(event.target.error);

                if(typeof callback==='function')
                    callback.call(scope, operation);
            };

            var objectStore= transaction.objectStore(me.getTable());
            for (var i in records)
                addRecord(records[i]);

            /**
             * Add a record to the database
             * @param {Object} record Record object to be inserted in the indexeddb
             * @method
             */
            function addRecord(record){
                objectStore.add(record.getData()).onsuccess = function(event){
                    //update record's info
                    record.setId(event.target.result);
                    record.phantom=false;
                }
            };
        };

        function openFail(error){
            operation.setException(error);

            if(typeof callback==='function')
                callback.call(scope, operation);
        };

        this.open(openSuccess, openFail);
    },


    /**
     * Performs the given read operation. 
     * @param {Ext.data.Operation} operation The Operation to perform
     * @param {Function} callback Callback function to be called when the Operation has completed (whether successful or not)
     * @param {Object} scope Scope to execute the callback function in
     * @method
     */
    read: function(operation, callback, scope){
        var me=this,
            records = operation.getRecords();

        function openSuccess(db){
            var queryRecords=[];

            operation.setStarted();

            var transaction=db.transaction(me.getTable());
            transaction.oncomplete = function(event){
                operation.setRecords(queryRecords);
                operation.setResultSet(Ext.create('Ext.data.ResultSet', {
                    records: operation.getRecords(),
                    total  : queryRecords.length,
                    count  : queryRecords.length
                }));
                operation.setSuccessful();
                operation.setCompleted();

                if (typeof callback == 'function')
                    callback.call(scope, operation);
            };
            transaction.onerror = function(event){
                operation.setException(event.target.error);

                if(typeof callback==='function')
                    callback.call(scope, operation);
            };


            var objectStore= transaction.objectStore(me.getTable());
            objectStore.openCursor().onsuccess = function(event){
                var cursor = event.target.result;

                if(cursor){
                    var record = Ext.create(me.getModel(), cursor.value);
                    record.phantom=false;
                    queryRecords.push(record);

                    cursor['continue']();
                }
            }
        };

        function openFail(error){
            operation.setException(error);

            if(typeof callback==='function')
                callback.call(scope, operation);
        };

        this.open(openSuccess, openFail);
    },

    /**
     * Performs the given update operation.
     * @param {Ext.data.Operation} operation The Operation to perform
     * @param {Function} callback Callback function to be called when the Operation has completed (whether successful or not)
     * @param {Object} scope Scope to execute the callback function in
     * @method
     */
    update: function(operation, callback, scope){
        var me=this,
            records = operation.getRecords();

        function openSuccess(db){
            var me=this,
                records=operation.getRecords();

            operation.setStarted();
            var transaction=db.transaction(me.getTable(),"readwrite");
            transaction.oncomplete = function(event){
                operation.setSuccessful();
                operation.setCompleted();

                if (typeof callback == 'function')
                    callback.call(scope, operation);
            };
            transaction.onerror = function(event){
                operation.setException(event.target.error);

                if (typeof callback == 'function')
                    callback.call(scope, operation);
            }

            var objectStore= transaction.objectStore(me.getTable());
             for (var i in records)
                objectStore.put(records[i].getData());
        };

        function openFail(error){
            operation.setException(error);

            if(typeof callback==='function')
                callback.call(scope, operation);
        };

        this.open(openSuccess, openFail);
    },

    /**
     * Performs the given destroy operation.
     * @param {Ext.data.Operation} operation The Operation to perform
     * @param {Function} callback Callback function to be called when the Operation has completed (whether successful or not)
     * @param {Object} scope Scope to execute the callback function in
     * @method
     */
    destroy: function(operation, callback, scope){
        var me=this,
            records = operation.getRecords();

        function openSuccess(db){
            operation.setStarted();

            var transaction=db.transaction(me.getTable(),"readwrite");
            transaction.oncomplete = function(event){
                operation.setSuccessful();
                operation.setCompleted();

                if (typeof callback == 'function')
                    callback.call(scope, operation);
            };
            transaction.onerror = function(event){
                operation.setException(event.target.error);

                if (typeof callback == 'function')
                    callback.call(scope, operation);
            }

            var objectStore = transaction.objectStore(me.getTable());
            for (var i in records)
                objectStore['delete'](records[i].getId());
        };

        function openFail(error){
            operation.setException(error);

            if(typeof callback==='function')
                callback.call(scope, operation);
        };

        this.open(openSuccess, openFail);
    },

    clear: function(){
        var me=this;

        function openSuccess(db){
            var objectStore = db.transaction(me.getTable(),"readwrite")
                                .objectStore(me.getTable());

            objectStore.openCursor().onsuccess = function(event){
                var cursor = event.target.result;
                if(cursor){
                    objectStore['delete'](cursor.key);
                    cursor['continue']();
                }
            }
        };

        function openFail(error){
            //log the error
        };

        this.open(openSuccess, openFail);
    }
});