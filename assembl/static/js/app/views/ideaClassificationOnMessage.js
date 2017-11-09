/**
 * 
 * @module app.views.ideaClassificationOnMessage
 */

import Marionette from 'backbone.marionette';

import $ from 'jquery';
import _ from 'underscore';
import Ctx from '../common/context.js';
import CollectionManager from '../common/collectionManager.js';
import Types from '../utils/types.js';
import BreadCrumbView from './breadcrumb.js';
import IdeaModel from '../models/idea.js';
import i18n from '../utils/i18n.js';
import openIdeaInModal from './modals/ideaInModal.js';
import Backbone from 'backbone';
import Promise from 'bluebird';
import LoaderView from './loaderView.js';
import Analytics from '../internal_modules/analytics/dispatcher.js';

// // root class
// var IdeaShowingMessageModel = Backbone.Model.extend({
//   ideaId: null // string. for example "local:Idea/19"
// });


/**
 * Abstract Class of Idea Classification Views
 */
var IdeaClassificationView = LoaderView.extend({
  constructor: function IdeaClassificationView() {
    LoaderView.apply(this, arguments);
  },

  template: false,

  ui: {
    viewIdea: ".js_seeIdea",
    breadcrumbs: ".js_breadcrumb"
  },

  events: {
    'click @ui.viewIdea': 'onSeeIdeaClick'
  },

  regions:{
    breadcrumb: "@ui.breadcrumbs"
  },

  /*
    Must pass the IdeaContentLink model as model to the view (done by Marionette)
    along with the groupContent
   */
  initialize: function(options){
    this.setLoading(true);
    this._groupContent = options.groupContent;
    this.messageView = options.messageView;
    this.canRender = false;
    var collectionManager = new CollectionManager();
    var that = this;

    Promise.join(
      this.model.getPostCreatorModelPromise(),
      that.model.getLinkCreatorModelPromise(),
      that.model.getIdeaModelPromise(),
      collectionManager.getUserLanguagePreferencesPromise(Ctx),
      function(postCreator, linkCreator, idea, langPrefs) {
        that.postCreator = postCreator;
        that.user = linkCreator;
        that.idea = idea;
        that.langPrefs = langPrefs;
        var ideaAncestry = that.idea.getAncestry();
        that.ideaAncestry = that.createIdeaNameCollection(ideaAncestry);
        return idea.collection.collectionManager.getAllExtractsCollectionPromise(
        ).then(function(extracts){
          if (_.isEmpty(extracts)) {
            that.extract = null;
          }
          else {
            //An extract IS an IdeaContentLink type
            that.extract = extracts.get(that.model.get("@id"));
          }
          that.canRender = true;
          that.onEndInitialization();
        });
      }).error(function(e){
        console.error(e.statusText);
        //Render yourself in an ErrorView.
        //THIS IS HACKY
        that.model.failedToLoad = true;
      });
  },

  /*
    Override in child class in order to add logic once the promises are
    completed in initialization
   */
  onEndInitialization: function(){
  },

  /*
    Override in child class in order to add logic at the end of onRender
   */
  postRender: function(){},

  /*
    The function used by the template to render itself, given it's model
    @returns Function  The function that will be returned with parameter for model
   */
  serializerFunc: function() {
    var langPrefs = this.langPrefs;
    return function(model) {
      return model ? model.getShortTitleDisplayText(langPrefs) : "";
    };
  },

  onRender: function(){
    if (this.canRender) {

      if (! this.ideaAncestry) {
        throw new Error("Idea Ancestry Collection was undefined on message ", this.model.get('idPost'));
      }

      var IdeaBreadcrumbView = new BreadCrumbView.BreadcrumbCollectionView({
        collection: this.ideaAncestry,
        serializerFunc: this.serializerFunc(),
      });

      this.showChildView('breadcrumb', IdeaBreadcrumbView);
      this.postRender();
    }
  },

  /*
    Generates a collection containing the same idea models used in the CollectionManager
   */
  createIdeaNameCollection: function(ideaArray){

    //Create an empty collection and populate it with the models in the Array
    //Shallow copy of the models. Hence, Idea changes should trigger change events on this collection
    //as well
    var col = new IdeaModel.Collection();
    _.each(ideaArray, function(idea){
      col.add(idea); //The order should be maintained
    });

    return col;
  }, 
  

  templateContext: function(){
    return {
      i18n: i18n,
      viewIdea: i18n.gettext("Go to this idea")
    };
  },

  onSeeIdeaClick: function(){
    var analytics = Analytics.getInstance();
    analytics.trackEvent(analytics.events.NAVIGATE_TO_IDEA_IN_IDEA_CLASSIFICATION);

    var panel = this.messageView.messageListView;
    Ctx.clearModal();
    openIdeaInModal(panel, this.idea, true);
  }

});

var DirectMessageView = IdeaClassificationView.extend({
  constructor: function DirectMessageView() {
    IdeaClassificationView.apply(this, arguments);
  },

  template: '#tmpl-ideaClassification_directMessage',

  onEndInitialization: function(){
    this.setLoading(false);
    this.render();
  },

  serializeData: function(){
    if (!this.canRender) {
      return {};
    }

    return {
      author: this.user.get('name')
    }
  }
});

var DirectExtractView = IdeaClassificationView.extend({
  constructor: function DirectExtractView() {
    IdeaClassificationView.apply(this, arguments);
  },

  template: '#tmpl-ideaClassification_directExtract',

  onEndInitialization: function(){
    this.setLoading(false);
    this.render();
  },

  serializeData: function(){
    if (!this.canRender) {
      return {};
    }

    return {
      harvester: this.user.get('name'),
      extractText: this.extract.getQuote(),
      postAuthor: this.postCreator.get('name')
    }
  }
});

var IndirectMessageView = IdeaClassificationView.extend({
  constructor: function IndirectMessageView() {
    IdeaClassificationView.apply(this, arguments);
  },

  template: '#tmpl-ideaClassification_indirectMessage',

  onEndInitialization: function(){
    this.setLoading(false);
    this.render();
  },

  serializeData: function(){
    if (!this.canRender){
      return {};
    }

    return {
      author: this.user.get('name')
    }
  }
});

var IndirectExtractView = IdeaClassificationView.extend({
  constructor: function IndirectExtractView() {
    IdeaClassificationView.apply(this, arguments);
  },

  template: '#tmpl-ideaClassification_indirectExtract',

  onEndInitialization: function(){
    this.setLoading(false);
    this.render();
  },

  serializeData: function() {
    if (!this.canRender){
      return {};
    }

    return {
      harvester: this.user.get('name'),
      extractText: this.extract.getQuote(),
      postAuthor: this.postCreator.get('name')
    }
  }
});


var ErrorView = Marionette.View.extend({
  constructor: function ErrorView() {
    Marionette.View.apply(this, arguments);
  },

  template: _.template("<div><%= i18n.gettext(\"Something went wrong in getting the contents of this idea. We are looking into it. Thank you for your patience.\") %></div>"),

  initialize: function(options){
    console.error("[IdeaClassificationModal] An error view was created on the idea content link", this.model.id);
  },

  serializeData: function(){
    return {
      i18n: i18n
    };
  }
});

var IdeaShowingMessageCollectionViewBody = Marionette.CollectionView.extend({
  constructor: function IdeaShowingMessageCollectionViewBody() {
    Marionette.CollectionView.apply(this, arguments);
  },

  className: 'items',

  initialize: function(options){
    this._groupContent = options.groupContent;
    this.messageView = options.messageView;
  },

  childViewOptions: function(){
    return {
      groupContent: this._groupContent,
      messageView: this.messageView
    }
  },

  childView: function(item){

    //In the scenario that the View failed to initialize the models necessary
    //to parse this. An Error view should be made.
    if (_.has(item, 'failedToLoad') && item.failedToLoad === true) {
      return ErrorView;
    }

    if (item.isDirect()){
      if (item.get('@type') === Types.IDEA_RELATED_POST_LINK) {
        return DirectMessageView;
      }

      if (item.get('@type') === Types.EXTRACT) {
        return DirectExtractView;
      }
      else {
        return ErrorView;
      }
    }

    else {
      if (item.get('@type') === Types.IDEA_RELATED_POST_LINK) {
        return IndirectMessageView;
      }

      if (item.get('@type') === Types.EXTRACT) {
        return IndirectExtractView;
      }
      else {
        return ErrorView;
      }
    }
  }
});


var IdeaShowingMessageCollectionView = Marionette.View.extend({
  constructor: function IdeaShowingMessageCollectionView() {
    Marionette.View.apply(this, arguments);
  },

  template: '#tmpl-ideaClassification_collection',

  regions: {
    items: {
      el: '.items',
      replaceElement: true,
    }
  },
  initialize: function(options){
    this._groupContent = options.groupContent;
    this.messageView = options.messageView;
  },
  onRender: function() {
    this.showChildView('items', new IdeaShowingMessageCollectionViewBody({
      collection: this.collection,
      groupContent: this._groupContent,
      messageView: this.messageView,
    }));
  },
});


var IdeasShowingMessageModal = Backbone.Modal.extend({
  constructor: function IdeasShowingMessageModal() {
    Backbone.Modal.apply(this, arguments);
  },


  template: '#tmpl-ideaClassification_modal',
  className: 'modal-ideas-showing-message popin-wrapper',
  cancelEl: '.close, .js_close',

  initialize: function(options) {
    this.messageView = options.messageView;
    this.messageModel = options.messageModel, 
    this.ideaContentLinks = options.ideaContentLinks;
    this._groupContent = options.groupContent;
  },

  serializeData: function() {
    var number_of_ideas = this.ideaContentLinks.length;
    return {
      visible_because_msg: i18n.sprintf(
        i18n.ngettext(
            "This message is linked to the following idea because: ",
            "This message is linked to the %1$d following ideas because: ",
            number_of_ideas),
        number_of_ideas),
      title_msg: i18n.ngettext(
        "Link between this message and the idea",
        "Links between this message and ideas", number_of_ideas)
    };
  },

  onRender: function(){
    var IdeaClassificationCollectionView = new IdeaShowingMessageCollectionView({
      collection: this.ideaContentLinks,
      messageView: this.messageView,
      groupContent: this._groupContent
    });

    this.$(".ideas-reasons-collection").html(IdeaClassificationCollectionView.render().el);
  }
});

export default IdeasShowingMessageModal;
