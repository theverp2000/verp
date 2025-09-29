Verp (Very-easy Enterprise Resource Planning) is an ERP server platform running on Nodejs written in Typescript/Javascript, the webclient side follows the standard of the Javascript/CSS/HTML trio.

The author's point of view is that there is a need for a platform that can act as both an ERP and a more multi-purpose platform to serve small and medium-sized organizations and businesses with the following criteria:

1) only needs to be written in a single programming language (basically Javascript/Typescript),
2) allows running on any operating system platform (Linux/Windows/MacOS),
3) easy to use (private server/cloud, web client/smartdevice),
4) easy to extend (install/uninstall modules on runtime).

Through the process of researching existing open source platforms, with my limited approach, the author has not found any software that fully meets my requirements. The author has also combined various platforms and supporting software packages but found that those implementations are still limited.

Odoo/OpenERP, is an interesting inspiration, however it is written in Javascript for the server side, so the webclient needs to use some hybrid techniques to process the javascript language for some specifications defined on the server and client side. In some aspects, Javascript is a great programming language for the server and Javascript is also great but it is difficult to completely replace it.

Through the efforts of applying, learning, inheriting and referencing Odoo/OpenERP and some other supporting packages of the community available on NPM, the author has tried to create the Verp platform to serve the above purpose and hopes that many users, especially the SME community, will have people who agree with that idea. The open source Verp project is written entirely in Javascript/Typescript on the server side; the client side is Javascript/CSS/HTML. 

In the early stages, many source codes are taken and converted from Javascript for the main purpose of easy experience, reference and bug fixing. In the future, when the platform is stable enough, the architecture will be converted as appropriately as possible. Most of the webclient packages are adopted from Odoo/OpenErp platform with compatibility tweaks to work smoothly with Nodejs server-side architecture. New improvements may need to be changed in the future to utilize the strengths of Nodejs as well as Javascript/Typescript.

This is the first version, which will be continuously updated. I hope many people are interested in experiencing and contributing positive comments to help Verp become more complete.

Bug patches, technical specifications and detailed instructions will be updated in the near future.