'use strict';

var _ = window._;
var Backbone = window.Backbone;
var MapView = window.MapView;
var RegionListView = window.RegionListView;
var RegionDetailsView = window.RegionDetailsView;

window.App = Backbone.View.extend({
    initialize: function() {
        this.mapView = null;
        this.regionListView = null;
        this.regionDetailsView = null;

        this.emptyDetailsView = this.emptyDetailsView.bind(this);
        this.fadeInListView = this.fadeInListView.bind(this);
        this.toggleDetails = this.toggleDetails.bind(this);

        this.listenTo(this.model, 'change:detailsVisible', this.toggleDetails);
        this.listenToOnce(this.model, 'change:regionList', this.createRegionList);
        this.listenToOnce(this.model, 'change:baseMapTilesUrl', this.createMapView);

        this.model.fetch();
        this.render();
    },

    render: function() {
        return this;
    },

    createMapView: function() {
        this.mapView = new MapView({ model: this.model });
        this.mapView.render();
    },

    createRegionList: function() {
        this.regionListView = new RegionListView({ model: this.model });
        this.regionListView.render();
    },

    emptyDetailsView: function() {
        this.regionDetailsView.$el.empty();
    },

    fadeInListView: function() {
        this.regionListView.$el.fadeIn(200);
    },

    toggleDetails: function() {
        if (this.model.get('detailsVisible')) {
            this.regionListView.$el.hide();
            this.regionDetailsView = new RegionDetailsView({
                model: this.model.get('selectedRegion'),
                hideDetails: this.model.hideDetails,
            });
            this.regionDetailsView.render();
            this.regionDetailsView.$el.show();
        } else {
            this.regionDetailsView.$el.fadeOut(200);
            _.delay(this.emptyDetailsView, 200);
            _.delay(this.fadeInListView, 200);
        }
    }
});
