define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        Assembl = require('modules/assembl'),
        Ctx = require('modules/context'),
        collectionManager = require('modules/collectionManager'),
        User = require('models/user'),
        storage = require('objects/storage'),
        navBar = require('views/navBar'),
        contextPage = require('views/contextPage'),
        GroupContainer = require('views/groups/groupContainer'),
        CollectionManager = require('modules/collectionManager'),
        viewsFactory = require('objects/viewsFactory'),
        $ = require('jquery'),
        Notification = require('views/notification'),
        adminView = require('views/admin/adminDiscussion'),
        Partners = require('models/partner_organization');

    var routeManager = Marionette.Controller.extend({

        initialize: function () {
            window.assembl = {};

            var collectionManager = new CollectionManager();

            /**
             * fulfill app.currentUser
             */
            function loadCurrentUser() {
                var user;
                if (Ctx.getCurrentUserId()) {
                    user = new User.Model();
                    user.fetchFromScriptTag('current-user-json');
                }
                else {
                    user = new User.Collection().getUnknownUser();
                }
                user.fetchPermissionsFromScripTag();
                Ctx.setCurrentUser(user);
                Ctx.loadCsrfToken(true);
            }

            loadCurrentUser();
        },

        /**
         * Load the default view
         * */
        home: function () { // a.k.a. "index", "discussion root"
            this.restoreViews();
        },

        contextPage: function () { // a.k.a. "home", "accueil" (according to the navigation menu) 
            // activate the home navigation item
            var groupSpecsP = collectionManager().getGroupSpecsCollectionPromise(viewsFactory);
            groupSpecsP.done(function (groupSpecs) {
                Assembl.vent.trigger("navigation:selected", "home");
            });
        },

        restoreViews: function () {
          Assembl.headerRegions.show(new navBar());
          /**
           * Render the current group of views
           * */
          var groupSpecsP = collectionManager().getGroupSpecsCollectionPromise(viewsFactory);

          groupSpecsP.done(function (groupSpecs) {
              var group = new GroupContainer({
                  collection: groupSpecs
              });
              var lastSave = storage.getDateOfLastViewSave();
              if (!lastSave
                  || (Date.now() - lastSave.getTime() > (7 * 24 * 60 * 60 * 1000))
                  ) {
                /* Reset the context of the user view, if it's too old to be 
                  usable, or if it wasn't initialized before */
                // Find if a group exists that has a navigation panel
                var navigableGroupSpec = groupSpecs.find(function (aGroupSpec) {
                  return aGroupSpec.getNavigationPanelSpec();
                  });
                if (navigableGroupSpec) {
                  window.setTimeout(function () {
                    var groupContent = group.children.findByModel(navigableGroupSpec);
                    groupContent.resetContextState();
                  });
                }
              }
              group.resizeAllPanels();
              Assembl.groupContainer.show(group);
          });
        },

        idea: function (id) {
            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    var idea = allIdeasCollection.get(id);
                    if (idea) {
                        Ctx.setCurrentIdea(idea);
                    }
                });
        },

        /**
         * Alias for `idea`
         */
        ideaSlug: function (slug, id) {
            return this.idea(slug + '/' + id);
        },

        message: function (id) {
            //TODO: add new behavior to show messageList Panel
            //Ctx.openPanel(assembl.messageList);
            Assembl.vent.trigger('messageList:showMessageById', id);
        },

        /**
         * Alias for `message`
         */
        messageSlug: function (slug, id) {
            return this.message(slug + '/' + id);
        },

        adminDiscussion: function () {
            var admin = new adminView();
            Assembl.adminContainer.show(admin);
        }

    });

    return new routeManager();

});