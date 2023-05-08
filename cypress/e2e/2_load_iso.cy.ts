describe('Load isoform inspector', () => {
  it('opens the isoform inspector view and prompts select file', () => {
    cy.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.visit('/')
    cy.contains('Empty').click()
    cy.contains('Launch view').click()
    cy.contains('Open').click()
    cy.get('[data-testid=view_menu_icon]').click()
    cy.contains('Track labels').click()
    cy.contains('Offset').click()
    cy.get('[data-testid=autocomplete]').children().find('input').clear()
    cy.get('[data-testid=autocomplete]')
      .click({ force: true })
      .type('PSME4{enter}')
    cy.contains('Open track selector').click()
    cy.contains('Gencode v19').click()
    cy.wait(5000)
    cy.contains('PSME4').rightclick()
    cy.contains('Open in the Isoform Inspector').click({ force: true })

    // open file screen successfully loads
    cy.contains('Opening file for: PSME4')

    // loads a file it selects
    cy.get('[data-testid=isoform-file-select').selectFile(
      'cypress/fixtures/test_subj_observ.json',
      { force: true },
    )
    // cy.contains('test_subj_observ.json').click().type('{enter}{enter}')
    cy.get('#select-multiple-native').select(['test_subj_observ.json'])
    cy.contains('Submit').click()
    cy.contains('Splice junction read counts (raw)')
  })
})
