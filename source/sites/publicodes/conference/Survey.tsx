import { useEffect, useState } from 'react'
import emoji from 'react-easy-emoji'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router'
import { useNavigate } from 'react-router-dom'

import { Trans, useTranslation } from 'react-i18next'
import { conferenceImg } from '../../../components/SessionBar'
import Meta from '../../../components/utils/Meta'
import { usePersistingState } from '../../../components/utils/persistState'
import Navigation from '../Navigation'
import { useProfileData } from '../Profil'
import { ConferenceTitle } from './Conference'
import ContextConversation from './ContextConversation'
import DataWarning from './DataWarning'
import Instructions from './Instructions'
import NoSurveyCreatedWarning from './NoSurveyCreatedWarning'
import NoTestMessage from './NoTestMessage'
import Stats from './Stats'
import { answersURL, surveysURL } from './useDatabase'
import { defaultProgressMin, defaultThreshold } from './utils'

export default () => {
	const [surveyIds] = usePersistingState('surveyIds', {})
	const [surveyContext, setSurveyContext] = usePersistingState(
		'surveyContext',
		{}
	)
	const [contextRules, setContextRules] = useState()
	const [isRegisteredSurvey, setIsRegisteredSurvey] = useState(null)
	const dispatch = useDispatch()

	const { room } = useParams()

	const cachedSurveyId = surveyIds[room]

	const { hasData } = useProfileData()
	const [hasDataState, setHasDataState] = useState(hasData)

	useEffect(() => {
		if (cachedSurveyId) {
			dispatch({ type: 'SET_SURVEY', room })
		}
	}, [cachedSurveyId])

	useEffect(() => {
		fetch(surveysURL + room)
			.then((response) => response.json())
			.then((json) => (json ? json[0]?.contextFile : null))
			.then((contextFile) => {
				if (!surveyContext[room]) {
					setSurveyContext({ ...surveyContext, [room]: {} })
				}
				dispatch({ type: 'ADD_SURVEY_CONTEXT', contextFile })
			})
			.catch((error) => console.log('error:', error))
	}, [])

	useEffect(() => {
		fetch(surveysURL + room)
			.then((response) => response.json())
			.then((json) => {
				setIsRegisteredSurvey(json?.length != 0)
			})
			.catch((error) => console.log('error:', error))
	}, [])

	const survey = useSelector((state) => state.survey)
	const existContext = survey ? !(survey['contextFile'] == null) : false
	const navigate = useNavigate()
	const { t } = useTranslation()

	if (!room || room === '') {
		return <Navigation to="/groupe?mode=sondage" replace />
	}
	return (
		<div>
			<Meta
				title={t('Sondage') + ' ' + room}
				description={
					t('Participez au sondage ') +
					room +
					t(' et visualisez les résultats du groupe')
				}
			/>
			<h1>Sondage</h1>
			{isRegisteredSurvey == false && (
				<div css="margin-bottom: 3rem">
					<NoSurveyCreatedWarning />
				</div>
			)}
			<ConferenceTitle>
				<img src={conferenceImg} alt="" />
				<span css="text-transform: uppercase">«&nbsp;{room}&nbsp;»</span>
			</ConferenceTitle>
			{!survey || survey.room !== room ? (
				<DataWarning room={room} />
			) : (
				<div
					css={`
						display: flex;
						flex-direction: column;
					`}
				>
					{existContext && (
						<ContextConversation
							surveyContext={surveyContext}
							setSurveyContext={setSurveyContext}
							contextRules={contextRules}
							setContextRules={setContextRules}
						/>
					)}
					{!hasDataState ? (
						<NoTestMessage setHasDataState={setHasDataState}></NoTestMessage>
					) : (
						<Results
							room={survey.room}
							existContext={existContext}
							contextRules={contextRules}
						/>
					)}
				</div>
			)}
			{survey && survey.room === room && (
				<>
					<Instructions {...{ room, mode: 'sondage', started: true }} />
					<div>
						<button
							className="ui__ link-button"
							onClick={() => {
								navigate('/')

								dispatch({ type: 'UNSET_SURVEY' })
							}}
						>
							{emoji('🚪')} Quitter le sondage
						</button>
					</div>
					<DownloadInteractiveButton
						url={answersURL + room + '?format=csv'}
						isRegisteredSurvey={isRegisteredSurvey}
					/>
				</>
			)}
		</div>
	)
}

const DownloadInteractiveButton = ({ url, isRegisteredSurvey }) => {
	const [clicked, click] = useState(false)

	return (
		<div>
			{!clicked ? (
				<a
					href="#"
					onClick={(e) => {
						click(true)
						e.preventDefault()
					}}
				>
					<Trans>💾 Télécharger les résultats</Trans>
				</a>
			) : isRegisteredSurvey ? (
				<div className="ui__ card content">
					<p>
						<Trans i18nKey={`publicodes.conference.Survey.csv`}>
							Vous pouvez récupérer les résultats du sondage dans le format
							.csv.
						</Trans>
					</p>
					<ul>
						<li>
							<Trans i18nKey={`publicodes.conference.Survey.libreOffice`}>
								Pour l'ouvrir avec{' '}
								<a href="https://fr.libreoffice.org" target="_blank">
									LibreOffice
								</a>
								, c'est automatique.
							</Trans>
						</li>
						<li>
							<Trans i18nKey={`publicodes.conference.Survey.excel`}>
								Pour l'ouvrir avec Microsoft Excel, ouvrez un tableur vide, puis
								Données {'>'} À partir d'un fichier texte / CSV. Sélectionnez
								"Origine : Unicode UTF-8" et "Délimiteur : virgule".
							</Trans>
						</li>
						<li>
							<Trans i18nKey={`publicodes.conference.Survey.resultat`}>
								Les résultats de la page de visualisation ne prennent en compte
								que les participants ayant rempli <b>au moins 10% du test</b>.
								En revanche le CSV contient les simulations de toutes les
								personnes ayant participé au sondage en cliquant sur le lien. La
								colonne "progress" vous permet de filtrer les simulations à
								votre tour.
							</Trans>
						</li>
					</ul>
					<a href={url} className="ui__ link-button">
						<Trans>💾 Lancer le téléchargement.</Trans>
					</a>
				</div>
			) : (
				<div>
					{' '}
					Le téléchargement pour ce sondage est indisponible. Ce problème vient
					sans doute du fait que le sondage n'a pas été créé via la page dédiée.
					N'hésitez pas à créer une salle au nom du sondage via{' '}
					<a href="https://nosgestesclimat.fr/groupe" target="_blank">
						ce formulaire d'instruction
					</a>{' '}
					(les réponses ne seront pas supprimées). Si le problème persiste,{' '}
					<a
						href="mailto:contact@nosgestesclimat.fr?subject=Problème téléchargement sondage"
						target="_blank"
					>
						contactez-nous
					</a>
					!
				</div>
			)}
		</div>
	)
}

export const surveyElementsAdapter = (items) =>
	Object.values(items).map((el) => ({
		...el.data,
		username: el.id,
	}))

const Results = ({ room, existContext, contextRules }) => {
	const [cachedSurveyIds] = usePersistingState('surveyIds', {})
	const survey = useSelector((state) => state.survey)
	const [threshold, setThreshold] = useState(defaultThreshold)
	const answerMap = survey.answers
	const username = cachedSurveyIds[survey.room]
	if (!answerMap || !Object.values(answerMap) || !username) return null
	const elements = surveyElementsAdapter(answerMap)
	return (
		<Stats
			totalElements={getElements(elements, threshold, existContext, 0)}
			elements={getElements(
				elements,
				threshold,
				existContext,
				defaultProgressMin
			)}
			username={username}
			threshold={threshold}
			setThreshold={setThreshold}
			contextRules={contextRules}
		/>
	)
}

// Simulations with less than 10% progress are excluded, in order to avoid a perturbation of the mean group value by people
// that did connect to the conference, but did not seriously start the test, hence resulting in multiple default value simulations.
// In case of survey with context, we only display result with context filled in.

export const getElements = (
	rawElements,
	threshold,
	existContext,
	progressMin
) => {
	const elementsWithinThreshold = rawElements.filter(
		(el) => el.total > 0 && el.total < threshold && el.progress >= progressMin
	)
	const elements = existContext
		? elementsWithinThreshold.filter(
				(el) => Object.keys(el.context).length !== 0
		  )
		: elementsWithinThreshold

	return elements
}
