async function uninstallHook(cr, registry) {
    await cr.execute(
        `DELETE FROM "irModelData" WHERE module = 'l10n_generic_coa'`
    );
}
