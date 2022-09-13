import React, { Suspense } from 'react'
import { Trans } from 'react-i18next'
import { useSelector } from 'react-redux'

const SurveyBar = React.lazy(() => import('./SurveyBar'))

export default () => {
	const survey = useSelector((state) => state.survey)
	if (!survey) return null

	return (
		<Suspense
			fallback={
				<div>
					<Trans>Chargement</Trans>
				</div>
			}
		>
			<SurveyBar />
		</Suspense>
	)
}
