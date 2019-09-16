<%@ Assembly Name="Venon.Sharepoint.Training, Version=1.0.0.0, Culture=neutral, PublicKeyToken=e28d4885dc2d81f5" %>
<%@ Import Namespace="Microsoft.SharePoint.ApplicationPages" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="asp" Namespace="System.Web.UI" Assembly="System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="home.aspx.cs" Inherits="Venon.Sharepoint.Training.Layouts.Venon.Sharepoint.Training.pages.home" DynamicMasterPageFile="~masterurl/custom.master" %>

<asp:Content ID="PageHead" ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <link href="/_layouts/15/Venon.Sharepoint.Training/css/home.css" rel="stylesheet" type="text/css"/>
    <script src="/_layouts/15/Venon.Sharepoint.Training/js/sp-forms/sp-forms-1.0.0.js" type="text/javascript"></script>
</asp:Content>

<asp:Content ID="Main" ContentPlaceHolderID="PlaceHolderMain" runat="server">
    <div class="container mt-5">
        <!-- Example row of columns -->
        <div class="row">
            <div class="col-md-4">
                <div data-list-name="Products" id="form1">

                </div>
            </div>
        </div>

    </div>

    <script>
        $(document).ready(function() {
            var options = { columns: [{ internalName: "Title", removeFromForm: true }] }
            var spForm = SpForms('#form1', options);
            spForm.buildForm().run();
        });
    </script>
</asp:Content>

<asp:Content ID="PageTitle" ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">

</asp:Content>

<asp:Content ID="PageTitleInTitleArea" ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server" >

</asp:Content>
