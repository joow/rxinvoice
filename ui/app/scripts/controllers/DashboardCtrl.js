'use strict';

angular.module('rxinvoiceApp')
    .controller('DashboardCtrl', function ($scope, $location, $filter, Company, Invoice, i18nUtils) {

        $scope.i18n = i18nUtils;
        $scope.companies = [];
        $scope.invoices = [];
        $scope.translateStatusLabel = Invoice.translateStatusLabel;

        var displayMode = "list";

        $scope.isListDisplayMode = function() {
            return displayMode === "list";
        };

        $scope.isTableDisplayMode = function() {
            return displayMode === "table";
        };


        $scope.toggleDisplayMode = function() {
            if (displayMode === "list") {
                displayMode = "table";
            } else if (displayMode === "table") {
                displayMode = "list";
            }
        };

        $scope.$watch("filter.companySelected", function(newValue, oldValue) {
            if (newValue) {
                var companies = $scope.filter.companiesList;
                for (var i = 0, l = companies.length; i < l; i++) {
                    var company = companies[i];
                    if (company._id == newValue) {
                        $scope.filter.businessList = company.business;
                        break;
                    }
                }
            }
        });
        $scope.filter = {
            searchText: '',
            businessSelected: '',
            companySelected: '',
            statusSelected: null,
            dateMin: null,
            dateMax: null,

            companiesList: [],
            businessList: [],
            statusList: [],


            selectCompany: function(company) {
                $scope.filter.companySelected = company._id;
                $scope.filter.businessSelected = '';
                $scope.filter.businessList = company.business;
            },
            selectBusiness: function(business) {
                $scope.filter.businessSelected = business.reference;
            },
            selectCompanyFromInvoice: function(invoice) {
                if (invoice && invoice.buyer) {
                    $scope.filter.companySelected = invoice.buyer._id;
                    $scope.filter.businessSelected = '';
                }
            },
            selectBusinessFromInvoice: function(invoice) {
                if (invoice && invoice.business && invoice.business.reference) {
                    $scope.filter.companySelected = invoice.buyer._id;
                    $scope.filter.businessSelected = invoice.business.reference;
                }
            },
            clearCompany: function() {
                $scope.filter.companySelected = '';
                $scope.filter.businessSelected = '';
                $scope.filter.businessList = [];
            },
            clearStatus: function() {
                $scope.filter.statusSelected = '';
                $scope.filter.dateMin = '';
                $scope.filter.dateMax = '';
            },

            filterCompanies: function(value) {
                return !$scope.filter.companySelected || $scope.filter.companySelected == value._id;
            },
            filterInvoices: function(value) {
                var filter = $scope.filter;
                var getDate = function(date) {
                    return moment(date).format('YYYYMMDD');
                }
                var filterDate = function() {
                    var compareMin = getDate(value.date) >= getDate(new Date(filter.dateMin));
                    var compareMax = getDate(value.date) <= getDate(new Date(filter.dateMax));
                    if (filter.dateMin) {
                        if (filter.dateMax) {
                            return compareMin && compareMax;
                        } else {
                            return compareMin;
                        }
                    } else if (filter.dateMax) {
                        return compareMax;
                    } else {
                        return true;
                    }
                }
                var ret =
                    (!filter.companySelected || (value.buyer && filter.companySelected == value.buyer._id)) &&
                    (!filter.statusSelected || filter.statusSelected == value.status) &&
                    (!filter.businessSelected || (value.business && filter.businessSelected == value.business.reference)) &&
                    (filterDate())
                ;
                return ret;
            }
        };
        $scope.orderBy = {
            company: null,
            companies: [
                {label: 'A-Z', predicate: 'name', reverse: false, selected: false},
                {label: 'Nb', predicate: 'metrics.nbInvoices', reverse: true, selected: false}
            ],
            byCompany: function(order) {
                if (this.company) {
                    this.company.selected = false;
                    if (this.company.predicate == order.predicate) {
                        this.company.reverse = !this.company.reverse;
                    }
                }
                this.company = order;
                this.company.selected = true;
            },

            invoice: null,
            invoices: [
                {label: 'A-Z', predicate: 'reference', reverse: false, selected: false},
                {label: 'Total', predicate: 'grossAmount', reverse: true, selected: false},
                {label: 'Date', predicate: 'date', reverse: true, selected: false}
            ],
            byInvoice: function(order) {
                if (this.invoice) {
                    this.invoice.selected = false;
                    if (this.invoice.predicate == order.predicate) {
                        this.invoice.reverse = !this.invoice.reverse;
                    }
                }
                this.invoice = order;
                this.invoice.selected = true;
            }
        }
        $scope.orderBy.byCompany($scope.orderBy.companies[0]);
        $scope.orderBy.byInvoice($scope.orderBy.invoices[2]);

        Company.findAll(function(data) {
            $scope.filter.companiesList = data;
        });
        Company.findBuyers(function(data) {
            $scope.companies = data;
        })
        Invoice.findAll(function(data) {
            $scope.invoices = data;
        });
        Invoice.getAllStatus(function(data) {
            angular.forEach(data, function(value, key) {
                this.push({_id:value, name:$scope.translateStatusLabel(value)});
            }, $scope.filter.statusList);
        });

        $scope.addCompany = function () {
            $location.url('/company/new');
        };
        $scope.editCompany = function() {
            if ($scope.filter.companySelected) {
                $location.url('/company/' + $scope.filter.companySelected);
            }
        };
        $scope.addInvoice = function () {
            $location.url('/invoice/new');
        };

        $scope.nbCompanies = function () {
            var companies = $filter('filter')($scope.companies, $scope.filter.filterCompanies);
            return companies.length;
        }
        $scope.nbBusiness = function () {
            var total = 0;
            var companies = $filter('filter')($scope.companies, $scope.filter.filterCompanies);
            for (var i = 0, l = companies.length; i < l; i++) {
                var company = companies[i];
                if (company.business) {
                    total += company.business.length;
                }
            }
            return total;
        }

        $scope.nbInvoices = function () {
            var invoices = $filter('filter')($scope.invoices, $scope.filter.filterInvoices);
            return invoices.length;
        }
        $scope.totalInvoices = function () {
            var total = 0;
            var invoices = $filter('filter')($scope.invoices, $scope.filter.filterInvoices);
            for (var i = 0, l = invoices.length; i < l; i++) {
                total += invoices[i].grossAmount;
            }
            return total;
        }


        $scope.getCompanies = function() {
            return $scope.company;
        }

        $scope.invoicesTableConfig = {
            isPaginationEnabled: false,
//            isGlobalSearchActivated: true,
            selectionMode: 'single'
        };

        $scope.$on('selectionChange', function (event, args) {
            console.log(args);
            $location.url("/invoice/" + args.item._id)
        });

        $scope.invoicesTableColumns = [
            {label: $scope.i18n.translate('invoice.buyer'), map: "buyer.name", headerClass:"cell-header invoice-buyer", cellClass: "cell-content invoice-buyer"},
            {label: $scope.i18n.translate('invoice.business'), map: "business.name", headerClass:"cell-header invoice-business", cellClass: "cell-content invoice-business"},
            {label: $scope.i18n.translate('invoice.object'), map: "object", headerClass:"cell-header invoice-object", cellClass: "cell-content invoice-object"},
            {label: $scope.i18n.translate('invoice.reference.short'), map:"reference", headerClass:"cell-header invoice-reference", cellClass: "cell-content invoice-reference"},
            {label: $scope.i18n.translate('invoice.date'), map: "date", formatFunction: 'date', formatParameter : 'dd/MM/yyyy', headerClass:"cell-header invoice-date", cellClass: "cell-content invoice-date"},
            {label: $scope.i18n.translate('invoice.status'), map:"status", formatFunction: $scope.translateStatusLabel, headerClass:"cell-header invoice-status", cellClass: "cell-content invoice-status"},
            {label: $scope.i18n.translate('invoice.lines.grossAmount'), map:"grossAmount",  formatFunction: 'currency', formatParameter: '€', headerClass:"cell-header invoice-grossAmount", cellClass:"cell-content cell-number invoice-grossAmount"}

        ];
    });
